"""
Admin Orders Router — /api/admin/orders/*
CRUD for orders (admin panel) + analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from decimal import Decimal
import time
import random
import logging

from app.config.database import get_db
from app.models.order import Order
from app.models.customer import Customer
from app.models.coupon import Coupon
from app.schemas.order import OrderCreate, OrderUpdate, OrderStatusUpdate
from app.middleware.admin_auth import verify_admin
from app.services.email import send_email
from app.utils.helpers import to_serializable

logger = logging.getLogger(__name__)

router = APIRouter()


async def _update_customer_from_order(db: AsyncSession, order_data: dict):
    """Update or create customer record when an order is placed."""
    email = order_data.get("customerEmail")
    if not email:
        return

    result = await db.execute(select(Customer).where(Customer.email == email))
    customer = result.scalar_one_or_none()

    total_amount = float(order_data.get("totalAmount", 0))

    if customer:
        customer.totalOrders = (customer.totalOrders or 0) + 1
        customer.totalSpent = Decimal(str(float(customer.totalSpent or 0) + total_amount))
        customer.lastOrderDate = datetime.utcnow()
        customer.phone = order_data.get("customerPhone") or customer.phone
        customer.name = order_data.get("customerName") or customer.name
    else:
        customer = Customer(
            name=order_data.get("customerName", ""),
            email=email,
            phone=order_data.get("customerPhone", ""),
            totalOrders=1,
            totalSpent=Decimal(str(total_amount)),
            lastOrderDate=datetime.utcnow(),
            status="active",
        )
        db.add(customer)

    await db.commit()


# ============ Routes ============

@router.get("/")
async def get_orders(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Order).order_by(Order.createdAt.desc()))
    orders = result.scalars().all()
    return [to_serializable(o) for o in orders]


@router.get("/analytics")
async def get_order_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    # Total orders
    total_result = await db.execute(select(func.count(Order.id)))
    total_orders = total_result.scalar() or 0

    # Total revenue
    revenue_result = await db.execute(select(func.sum(Order.totalAmount)))
    total_revenue = float(revenue_result.scalar() or 0)

    # Status counts
    status_result = await db.execute(
        select(Order.status, func.count(Order.status))
        .group_by(Order.status)
    )
    status_counts = {row[0]: int(row[1]) for row in status_result.all()}

    # Sales trend (last 30 days)
    thirty_days_ago = datetime.utcnow() - timedelta(days=30)
    trend_result = await db.execute(
        select(
            func.date(Order.createdAt).label("date"),
            func.count(Order.id).label("orders"),
            func.sum(Order.totalAmount).label("revenue"),
        )
        .where(Order.createdAt >= thirty_days_ago)
        .group_by(func.date(Order.createdAt))
        .order_by(func.date(Order.createdAt).asc())
    )
    sales_trend = [
        {"date": str(row.date), "orders": int(row.orders), "revenue": float(row.revenue or 0)}
        for row in trend_result.all()
    ]

    return {
        "totalOrders": total_orders,
        "totalRevenue": total_revenue,
        "statusCounts": status_counts,
        "salesTrend": sales_trend,
    }


@router.get("/{order_id}")
async def get_order_by_id(
    order_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return to_serializable(order)


@router.post("/")
async def create_order(
    body: OrderCreate,
    db: AsyncSession = Depends(get_db),
):
    """Create a new order. Not admin-protected (called from checkout)."""
    order_number = body.orderNumber
    if not order_number:
        timestamp = str(int(time.time() * 1000))[-6:]
        rand = random.randint(1000, 9999)
        order_number = f"SJ-{timestamp}-{rand}"

    # Increment coupon usage if a coupon was applied
    if body.couponCode:
        coupon_result = await db.execute(
            select(Coupon).where(
                Coupon.code == body.couponCode,
                Coupon.isActive == True,
                Coupon.isDeleted == False,
            )
        )
        coupon = coupon_result.scalar_one_or_none()
        if coupon:
            coupon.usedCount = (coupon.usedCount or 0) + 1

    order = Order(
        orderNumber=order_number,
        customerName=body.customerName,
        customerEmail=body.customerEmail,
        customerPhone=body.customerPhone,
        shippingAddress=body.shippingAddress,
        items=body.items,
        totalAmount=body.totalAmount,
        status=body.status or "pending",
        paymentMethod=body.paymentMethod,
        paymentStatus=body.paymentStatus or "pending",
        razorpayOrderId=body.razorpayOrderId,
        razorpayPaymentId=body.razorpayPaymentId,
        couponCode=body.couponCode,
        originalSubtotal=body.originalSubtotal,
        discountAmount=body.discountAmount,
        shippingCost=body.shippingCost,
    )

    db.add(order)
    await db.commit()
    await db.refresh(order)

    # Update customer data
    try:
        await _update_customer_from_order(db, {
            "customerName": body.customerName,
            "customerEmail": body.customerEmail,
            "customerPhone": body.customerPhone,
            "totalAmount": float(body.totalAmount),
        })
    except Exception as e:
        print(f"Error updating customer from order: {e}")

    # Send order confirmation email
    if order.customerEmail:
        try:
            items_array = order.items or []
            items_html = ""
            for item in items_array:
                qty = item.get("quantity", 1)
                price = float(item.get("price", item.get("discountedPrice", 0)))
                total_price = f"{price * qty:.2f}"
                customization_html = ""
                if item.get("shirtSize"):
                    customization_html += f'<div style="font-size: 11px; color: #777;">Size: {item["shirtSize"]}</div>'
                if item.get("customRequest"):
                    customization_html += f'<div style="font-size: 11px; color: #777; font-style: italic;">Request: {item["customRequest"]}</div>'
                items_html += f"""
                <tr>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">
                        <div>{item.get("name", "Unknown Item")}</div>
                        {customization_html}
                    </td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">{qty}</td>
                    <td style="padding: 8px; border-bottom: 1px solid #eee;">₹{total_price}</td>
                </tr>
                """

            await send_email(
                to=order.customerEmail,
                subject=f"Order Confirmation #{order.orderNumber} - SaajJewels",
                html=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #c6a856;">Order Confirmation</h2>
                    <p>Hello {order.customerName or "Valued Customer"},</p>
                    <p>Thank you for your order! We're excited to fulfill your purchase.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
                        <h3>Order Details:</h3>
                        <p><strong>Order Number:</strong> {order.orderNumber}</p>
                        <p><strong>Total Amount:</strong> ₹{float(order.totalAmount):.2f}</p>
                        <p><strong>Payment Method:</strong> Online Payment</p>
                    </div>
                    <h3>Items Ordered:</h3>
                    <table style="width: 100%; border-collapse: collapse; margin: 15px 0;">
                        <thead>
                            <tr>
                                <th style="text-align: left; border-bottom: 1px solid #ddd; padding: 8px;">Item</th>
                                <th style="text-align: left; border-bottom: 1px solid #ddd; padding: 8px;">Quantity</th>
                                <th style="text-align: left; border-bottom: 1px solid #ddd; padding: 8px;">Price</th>
                            </tr>
                        </thead>
                        <tbody>{items_html or '<tr><td colspan="3">No items found</td></tr>'}</tbody>
                    </table>
                    <h3>Shipping Address:</h3>
                    <div style="background-color: #f9f9f9; padding: 10px; margin: 15px 0;">
                        <p>{order.customerName or "N/A"}</p>
                        <p>{order.shippingAddress or "Address not provided"}</p>
                    </div>
                    <p>We'll send you another email when your order ships.</p>
                    <p>Thank you for shopping with SaajJewels!</p>
                    <p>The SaajJewels Team</p>
                </div>
                """,
            )
        except Exception as e:
            print(f"Failed to send order confirmation email: {e}")

    return to_serializable(order)


@router.put("/{order_id}")
async def update_order(
    order_id: int,
    body: OrderUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(order, key):
            setattr(order, key, value)

    await db.commit()
    await db.refresh(order)

    return {
        "success": True,
        "message": "Order updated successfully",
        "order": to_serializable(order),
    }


@router.put("/{order_id}/status")
async def update_order_status(
    order_id: int,
    body: OrderStatusUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    order.status = body.status
    await db.commit()
    await db.refresh(order)

    # Send shipping notification email
    if body.status == "shipped" and order.customerEmail:
        try:
            await send_email(
                to=order.customerEmail,
                subject=f"Your SaajJewels Order #{order.orderNumber} Has Been Shipped",
                html=f"""
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #c6a856;">Order Shipped Notification</h2>
                    <p>Hello {order.customerName or "Valued Customer"},</p>
                    <p>Great news! Your order #{order.orderNumber} has been shipped and is on its way to you.</p>
                    <div style="background-color: #f5f5f5; padding: 15px; margin: 20px 0;">
                        <h3>Order Details:</h3>
                        <p><strong>Order Number:</strong> {order.orderNumber}</p>
                        <p><strong>Total Amount:</strong> ₹{float(order.totalAmount):.2f}</p>
                    </div>
                    <p>You will receive tracking information via email once your package is out for delivery.</p>
                    <p>Thank you for shopping with SaajJewels!</p>
                    <p>The SaajJewels Team</p>
                </div>
                """,
            )
        except Exception as e:
            print(f"Failed to send shipping notification: {e}")

    return {
        "success": True,
        "message": "Order status updated successfully",
        "order": to_serializable(order),
    }


@router.delete("/{order_id}")
async def delete_order(
    order_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    await db.delete(order)
    await db.commit()

    return {"success": True, "message": "Order deleted successfully"}
