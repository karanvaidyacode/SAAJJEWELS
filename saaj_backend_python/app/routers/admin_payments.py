"""
Admin Payments Router — /api/admin/payments/*
Payment management derived from the orders table.
Mirrors the old Node.js in-memory payment controller but now
reads real payment data from orders.
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from typing import Optional

from app.config.database import get_db
from app.models.order import Order
from app.middleware.admin_auth import verify_admin
from app.utils.helpers import to_serializable

router = APIRouter()


def _order_to_payment(order) -> dict:
    """Convert an Order row into a payment-shaped dict for the frontend."""
    raw = to_serializable(order)
    return {
        "id": str(raw.get("id", "")),
        "orderId": raw.get("id"),
        "orderNumber": raw.get("orderNumber"),
        "customerName": raw.get("customerName", ""),
        "customerEmail": raw.get("customerEmail", ""),
        "customerPhone": raw.get("customerPhone", ""),
        "amount": float(raw.get("totalAmount", 0)),
        "method": raw.get("paymentMethod", ""),
        "status": raw.get("paymentStatus", "pending"),
        "razorpayOrderId": raw.get("razorpayOrderId"),
        "razorpayPaymentId": raw.get("razorpayPaymentId"),
        "createdAt": raw.get("createdAt"),
        "updatedAt": raw.get("updatedAt"),
    }


# ── GET /  — list all payments ──────────────────────────────────────────────
@router.get("/")
async def get_all_payments(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Order).order_by(Order.createdAt.desc()))
    orders = result.scalars().all()
    return [_order_to_payment(o) for o in orders]


# ── GET /status?status=paid  — filter by payment status ────────────────────
@router.get("/status")
async def get_payments_by_status(
    request: Request,
    status: str = Query(..., description="Payment status to filter by"),
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(
        select(Order)
        .where(Order.paymentStatus == status.lower())
        .order_by(Order.createdAt.desc())
    )
    orders = result.scalars().all()
    return [_order_to_payment(o) for o in orders]


# ── GET /analytics  — payment analytics / summary ──────────────────────────
@router.get("/analytics")
async def get_payment_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    # Total payments
    total_result = await db.execute(select(func.count(Order.id)))
    total_payments = total_result.scalar() or 0

    # Total collected (paid)
    collected_result = await db.execute(
        select(func.sum(Order.totalAmount)).where(Order.paymentStatus == "paid")
    )
    total_collected = float(collected_result.scalar() or 0)

    # Pending amount
    pending_result = await db.execute(
        select(func.sum(Order.totalAmount)).where(Order.paymentStatus == "pending")
    )
    total_pending = float(pending_result.scalar() or 0)

    # Counts by payment status
    status_result = await db.execute(
        select(Order.paymentStatus, func.count(Order.id))
        .group_by(Order.paymentStatus)
    )
    status_counts = {row[0]: int(row[1]) for row in status_result.all()}

    # Counts by payment method
    method_result = await db.execute(
        select(Order.paymentMethod, func.count(Order.id))
        .where(Order.paymentMethod.isnot(None))
        .group_by(Order.paymentMethod)
    )
    method_counts = {row[0]: int(row[1]) for row in method_result.all()}

    return {
        "totalPayments": total_payments,
        "totalCollected": total_collected,
        "totalPending": total_pending,
        "statusCounts": status_counts,
        "methodCounts": method_counts,
    }


# ── GET /{payment_id}  — get single payment ────────────────────────────────
@router.get("/{payment_id}")
async def get_payment_by_id(
    payment_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Order).where(Order.id == payment_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Payment not found")
    return _order_to_payment(order)


# ── PUT /{payment_id}  — update payment status on order ─────────────────────
@router.put("/{payment_id}")
async def update_payment(
    payment_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    body = await request.json()

    result = await db.execute(select(Order).where(Order.id == payment_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Payment not found")

    # Only allow updating payment-related fields
    if "status" in body and body["status"] in ("pending", "paid", "failed", "refunded"):
        order.paymentStatus = body["status"]
    if "paymentStatus" in body and body["paymentStatus"] in ("pending", "paid", "failed", "refunded"):
        order.paymentStatus = body["paymentStatus"]
    if "method" in body:
        order.paymentMethod = body["method"]
    if "paymentMethod" in body:
        order.paymentMethod = body["paymentMethod"]

    await db.commit()
    await db.refresh(order)
    return _order_to_payment(order)


# ── POST /search  — search payments ────────────────────────────────────────
@router.post("/search")
async def search_payments(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    body = await request.json()
    query = body.get("query", "")

    result = await db.execute(
        select(Order)
        .where(
            or_(
                Order.orderNumber.ilike(f"%{query}%"),
                Order.customerName.ilike(f"%{query}%"),
                Order.customerEmail.ilike(f"%{query}%"),
                Order.razorpayOrderId.ilike(f"%{query}%"),
                Order.razorpayPaymentId.ilike(f"%{query}%"),
            )
        )
        .order_by(Order.createdAt.desc())
        .limit(20)
    )
    orders = result.scalars().all()
    return [_order_to_payment(o) for o in orders]
