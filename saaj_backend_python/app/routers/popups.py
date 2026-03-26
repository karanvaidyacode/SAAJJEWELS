"""
Public Popups Router — /api/popups/*
Returns active popup configurations for the storefront.
"""

from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.config.database import get_db
from app.models.popup import Popup
from app.models.coupon import Coupon

router = APIRouter()


@router.get("/active")
async def get_active_popup(db: AsyncSession = Depends(get_db)):
    """Return the first active, non-deleted, currently-valid popup with its coupon."""
    now = datetime.utcnow()
    query = (
        select(Popup)
        .where(
            Popup.isActive == True,
            Popup.isDeleted == False,
        )
        .order_by(Popup.createdAt.desc())
    )
    result = await db.execute(query)
    popups = result.scalars().all()

    for popup in popups:
        if popup.startsAt and popup.startsAt > now:
            continue
        if popup.endsAt and popup.endsAt < now:
            continue

        data = {
            "id": popup.id,
            "title": popup.title,
            "description": popup.description,
            "delaySeconds": popup.delaySeconds,
            "showOnPages": popup.showOnPages,
            "couponCode": None,
            "couponDiscountType": None,
            "couponDiscountValue": None,
            "couponMaxDiscount": None,
        }

        if popup.couponId:
            coupon_result = await db.execute(
                select(Coupon).where(
                    Coupon.id == popup.couponId,
                    Coupon.isActive == True,
                    Coupon.isDeleted == False,
                )
            )
            coupon = coupon_result.scalar_one_or_none()
            if coupon:
                expired = coupon.expiresAt and coupon.expiresAt < now
                maxed = coupon.maxUses is not None and coupon.usedCount >= coupon.maxUses
                if not expired and not maxed:
                    data["couponCode"] = coupon.code
                    data["couponDiscountType"] = coupon.discountType
                    data["couponDiscountValue"] = coupon.discountValue
                    data["couponMaxDiscount"] = coupon.maxDiscount

        return data

    return None
