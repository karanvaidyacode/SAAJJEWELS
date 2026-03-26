"""
Public Coupons Router — /api/coupons/*
Validate a coupon at checkout and retrieve active popup config.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func as sa_func
from datetime import datetime

from app.config.database import get_db
from app.models.coupon import Coupon
from app.models.order import Order
from app.schemas.coupon import CouponValidateRequest

router = APIRouter()


async def _check_per_user_limit(
    coupon: Coupon, email: str | None, db: AsyncSession
) -> None:
    """Raise 400 if the user (identified by email) has already used this coupon
    up to its perUserLimit."""
    if not coupon.perUserLimit or not email:
        return

    email_lower = email.strip().lower()
    result = await db.execute(
        select(sa_func.count(Order.id)).where(
            Order.customerEmail.ilike(email_lower),
            Order.couponCode == coupon.code,
        )
    )
    usage_count = result.scalar() or 0

    if usage_count >= coupon.perUserLimit:
        raise HTTPException(
            status_code=400,
            detail=f"You have already used this coupon the maximum number of times ({coupon.perUserLimit})",
        )


@router.post("/validate")
async def validate_coupon(body: CouponValidateRequest, db: AsyncSession = Depends(get_db)):
    """Validate a coupon code and return the discount details (does NOT increment usedCount)."""
    code = body.code.strip().upper()
    result = await db.execute(
        select(Coupon).where(Coupon.code == code, Coupon.isDeleted == False)
    )
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")

    if not coupon.isActive:
        raise HTTPException(status_code=400, detail="This coupon is no longer active")

    if coupon.expiresAt and coupon.expiresAt < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This coupon has expired")

    if coupon.maxUses is not None and coupon.usedCount >= coupon.maxUses:
        raise HTTPException(status_code=400, detail="This coupon has reached its usage limit")

    if coupon.minOrderValue and body.orderTotal < coupon.minOrderValue:
        raise HTTPException(
            status_code=400,
            detail=f"Minimum order value of ₹{coupon.minOrderValue} required",
        )

    await _check_per_user_limit(coupon, body.email, db)

    if coupon.discountType == "percentage":
        discount = body.orderTotal * (coupon.discountValue / 100)
        if coupon.maxDiscount and discount > coupon.maxDiscount:
            discount = coupon.maxDiscount
    else:
        discount = min(coupon.discountValue, body.orderTotal)

    return {
        "valid": True,
        "code": coupon.code,
        "discountType": coupon.discountType,
        "discountValue": coupon.discountValue,
        "maxDiscount": coupon.maxDiscount,
        "calculatedDiscount": round(discount, 2),
        "description": coupon.description,
    }


@router.post("/apply")
async def apply_coupon(body: CouponValidateRequest, db: AsyncSession = Depends(get_db)):
    """Apply a coupon — validates and increments usedCount."""
    code = body.code.strip().upper()
    result = await db.execute(
        select(Coupon).where(Coupon.code == code, Coupon.isDeleted == False)
    )
    coupon = result.scalar_one_or_none()

    if not coupon:
        raise HTTPException(status_code=404, detail="Invalid coupon code")
    if not coupon.isActive:
        raise HTTPException(status_code=400, detail="This coupon is no longer active")
    if coupon.expiresAt and coupon.expiresAt < datetime.utcnow():
        raise HTTPException(status_code=400, detail="This coupon has expired")
    if coupon.maxUses is not None and coupon.usedCount >= coupon.maxUses:
        raise HTTPException(status_code=400, detail="This coupon has reached its usage limit")

    await _check_per_user_limit(coupon, body.email, db)

    if coupon.discountType == "percentage":
        discount = body.orderTotal * (coupon.discountValue / 100)
        if coupon.maxDiscount and discount > coupon.maxDiscount:
            discount = coupon.maxDiscount
    else:
        discount = min(coupon.discountValue, body.orderTotal)

    coupon.usedCount += 1
    await db.commit()

    return {
        "applied": True,
        "code": coupon.code,
        "calculatedDiscount": round(discount, 2),
    }
