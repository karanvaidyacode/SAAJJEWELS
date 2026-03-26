"""
Razorpay Router — /api/razorpay/*
Payment order creation, verification, and webhook.
"""

from fastapi import APIRouter, HTTPException, Request, Depends
from pydantic import BaseModel
from typing import Optional, Any
import hashlib
import hmac
import logging

from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.config.settings import get_settings
from app.config.database import get_db
from app.models.customer import Customer
from app.models.order import Order

settings = get_settings()
router = APIRouter()
logger = logging.getLogger(__name__)

# Initialize Razorpay client
_razorpay_client = None


def _get_razorpay_client():
    global _razorpay_client
    if _razorpay_client is None:
        import razorpay
        _razorpay_client = razorpay.Client(
            auth=(settings.RAZORPAY_API_KEY, settings.RAZORPAY_API_SECRET)
        )
    return _razorpay_client


class CreateOrderRequest(BaseModel):
    amount: Any  # Can be int or str
    currency: Optional[str] = "INR"
    receipt: Optional[str] = None
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    shippingAddress: Optional[str] = None


class VerifyPaymentRequest(BaseModel):
    razorpay_order_id: str
    razorpay_payment_id: str
    razorpay_signature: str
    orderData: Optional[dict] = None


async def _update_customer_from_order(db: AsyncSession, order_data: dict):
    """
    Find or create a Customer record when a payment is verified.
    Mirrors the Node.js updateCustomerFromOrder logic.
    """
    customer_email = order_data.get("customerEmail")
    if not customer_email:
        return

    customer_name = order_data.get("customerName", "")
    customer_phone = order_data.get("customerPhone", "")
    total_amount = float(order_data.get("totalAmount", 0))

    try:
        result = await db.execute(
            select(Customer).where(Customer.email == customer_email)
        )
        customer = result.scalar_one_or_none()

        if customer:
            # Update existing customer
            customer.totalOrders = (customer.totalOrders or 0) + 1
            customer.totalSpent = float(customer.totalSpent or 0) + total_amount
            from datetime import datetime
            customer.lastOrderDate = datetime.utcnow()
            if customer_phone:
                customer.phone = customer_phone
            if customer_name:
                customer.name = customer_name
            logger.info(f"Updated existing customer: {customer_email}")
        else:
            # Create new customer
            from datetime import datetime
            new_customer = Customer(
                name=customer_name or "",
                email=customer_email,
                phone=customer_phone or "",
                totalOrders=1,
                totalSpent=total_amount,
                lastOrderDate=datetime.utcnow(),
                status="active",
            )
            db.add(new_customer)
            logger.info(f"Created new customer: {customer_email}")

        await db.commit()
    except Exception as e:
        logger.error(f"Error updating customer from order: {e}")
        # Don't fail payment verification if customer update fails
        await db.rollback()


@router.post("/create-order")
async def create_razorpay_order(body: CreateOrderRequest):
    """Create a new Razorpay order."""
    try:
        # Convert amount to integer (paise)
        amount_in_paise = body.amount
        if isinstance(amount_in_paise, str):
            amount_in_paise = int(amount_in_paise)
        elif isinstance(amount_in_paise, float):
            amount_in_paise = round(amount_in_paise)

        if not isinstance(amount_in_paise, int):
            raise HTTPException(
                status_code=400,
                detail={
                    "error": "Invalid amount",
                    "message": "The amount must be an integer (in paise)",
                },
            )

        import time
        order_options = {
            "amount": amount_in_paise,
            "currency": body.currency or "INR",
            "receipt": body.receipt or f"receipt_{int(time.time())}",
            "payment_capture": 1,
        }

        logger.info(f"Creating Razorpay order with options: {order_options}")
        client = _get_razorpay_client()
        order = client.order.create(data=order_options)

        # Add customer data to the response
        order["customerName"] = body.customerName
        order["customerEmail"] = body.customerEmail
        order["customerPhone"] = body.customerPhone
        order["shippingAddress"] = body.shippingAddress

        return order

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Order creation error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Error creating order",
                "message": str(e),
            },
        )


@router.post("/verify-payment")
async def verify_payment(
    body: VerifyPaymentRequest,
    db: AsyncSession = Depends(get_db),
):
    """Verify Razorpay payment signature and update customer data."""
    try:
        sign = f"{body.razorpay_order_id}|{body.razorpay_payment_id}"
        expected_signature = hmac.new(
            settings.RAZORPAY_API_SECRET.encode("utf-8"),
            sign.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()

        if expected_signature == body.razorpay_signature:
            # Update customer data when payment is verified
            if body.orderData and body.orderData.get("customerEmail"):
                try:
                    await _update_customer_from_order(db, body.orderData)
                except Exception as customer_error:
                    logger.error(f"Error updating customer from order: {customer_error}")
                    # Don't fail the payment verification if customer update fails

            return {"status": "success"}
        else:
            raise HTTPException(
                status_code=400,
                detail={"status": "failure", "error": "Invalid signature"},
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Payment verification error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Error verifying payment",
                "message": str(e),
            },
        )


@router.post("/webhook")
async def razorpay_webhook(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Webhook endpoint for Razorpay payment status updates with signature verification."""
    try:
        body = await request.body()
        signature = request.headers.get("X-Razorpay-Signature", "")

        if not signature:
            raise HTTPException(status_code=400, detail="Missing webhook signature")

        expected_signature = hmac.new(
            settings.RAZORPAY_API_SECRET.encode("utf-8"),
            body,
            hashlib.sha256,
        ).hexdigest()

        if not hmac.compare_digest(expected_signature, signature):
            raise HTTPException(status_code=400, detail="Invalid webhook signature")

        import json
        payload = json.loads(body)
        event = payload.get("event", "")

        if event == "payment.captured":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id = payment_entity.get("order_id")
            razorpay_payment_id = payment_entity.get("id")

            if razorpay_order_id:
                result = await db.execute(
                    select(Order).where(Order.razorpayOrderId == razorpay_order_id)
                )
                order = result.scalar_one_or_none()
                if order and order.paymentStatus != "paid":
                    order.paymentStatus = "paid"
                    if razorpay_payment_id:
                        order.razorpayPaymentId = razorpay_payment_id
                    await db.commit()
                    logger.info(f"Webhook: marked order {order.orderNumber} as paid")

        elif event == "payment.failed":
            payment_entity = payload.get("payload", {}).get("payment", {}).get("entity", {})
            razorpay_order_id = payment_entity.get("order_id")

            if razorpay_order_id:
                result = await db.execute(
                    select(Order).where(Order.razorpayOrderId == razorpay_order_id)
                )
                order = result.scalar_one_or_none()
                if order:
                    order.paymentStatus = "failed"
                    await db.commit()
                    logger.info(f"Webhook: marked order {order.orderNumber} as failed")

        return {"status": "ok"}

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Webhook error: {e}")
        raise HTTPException(
            status_code=500,
            detail={
                "error": "Error processing webhook",
                "message": str(e),
            },
        )
