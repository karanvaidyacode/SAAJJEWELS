"""
Admin Popups Router — /api/admin/popups/*
CRUD for promotional popup configurations, with soft + hard delete.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, delete
from datetime import datetime

from app.config.database import get_db
from app.middleware.admin_auth import verify_admin
from app.models.popup import Popup
from app.models.coupon import Coupon
from app.schemas.popup import PopupCreate, PopupUpdate, PopupOut

router = APIRouter(dependencies=[Depends(verify_admin)])


async def _enrich_popup(popup: Popup, db: AsyncSession) -> dict:
    """Attach coupon details to the popup dict."""
    data = PopupOut.model_validate(popup).model_dump()
    if popup.couponId:
        result = await db.execute(select(Coupon).where(Coupon.id == popup.couponId))
        coupon = result.scalar_one_or_none()
        if coupon:
            data["couponCode"] = coupon.code
            data["couponDiscountType"] = coupon.discountType
            data["couponDiscountValue"] = coupon.discountValue
    return data


@router.get("/")
async def list_popups(
    include_deleted: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    query = select(Popup).order_by(Popup.createdAt.desc())
    if not include_deleted:
        query = query.where(Popup.isDeleted == False)
    result = await db.execute(query)
    popups = result.scalars().all()
    enriched = [await _enrich_popup(p, db) for p in popups]
    return {"popups": enriched}


@router.get("/{popup_id}")
async def get_popup(popup_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Popup).where(Popup.id == popup_id))
    popup = result.scalar_one_or_none()
    if not popup:
        raise HTTPException(status_code=404, detail="Popup not found")
    return await _enrich_popup(popup, db)


@router.post("/", status_code=201)
async def create_popup(body: PopupCreate, db: AsyncSession = Depends(get_db)):
    if body.couponId:
        coupon_result = await db.execute(select(Coupon).where(Coupon.id == body.couponId))
        if not coupon_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Linked coupon not found")

    popup = Popup(**body.model_dump())
    db.add(popup)
    await db.commit()
    await db.refresh(popup)
    return await _enrich_popup(popup, db)


@router.put("/{popup_id}")
async def update_popup(
    popup_id: int, body: PopupUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Popup).where(Popup.id == popup_id))
    popup = result.scalar_one_or_none()
    if not popup:
        raise HTTPException(status_code=404, detail="Popup not found")

    update_data = body.model_dump(exclude_unset=True)
    if "couponId" in update_data and update_data["couponId"]:
        coupon_result = await db.execute(
            select(Coupon).where(Coupon.id == update_data["couponId"])
        )
        if not coupon_result.scalar_one_or_none():
            raise HTTPException(status_code=404, detail="Linked coupon not found")

    for key, value in update_data.items():
        setattr(popup, key, value)

    await db.commit()
    await db.refresh(popup)
    return await _enrich_popup(popup, db)


@router.patch("/{popup_id}/toggle")
async def toggle_popup(popup_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Popup).where(Popup.id == popup_id))
    popup = result.scalar_one_or_none()
    if not popup:
        raise HTTPException(status_code=404, detail="Popup not found")

    popup.isActive = not popup.isActive
    await db.commit()
    await db.refresh(popup)
    return await _enrich_popup(popup, db)


@router.delete("/{popup_id}/soft")
async def soft_delete_popup(popup_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Popup).where(Popup.id == popup_id))
    popup = result.scalar_one_or_none()
    if not popup:
        raise HTTPException(status_code=404, detail="Popup not found")

    popup.isDeleted = True
    popup.isActive = False
    popup.deletedAt = datetime.utcnow()
    await db.commit()
    return {"message": "Popup soft-deleted", "id": popup_id}


@router.post("/{popup_id}/restore")
async def restore_popup(popup_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Popup).where(Popup.id == popup_id))
    popup = result.scalar_one_or_none()
    if not popup:
        raise HTTPException(status_code=404, detail="Popup not found")

    popup.isDeleted = False
    popup.deletedAt = None
    await db.commit()
    await db.refresh(popup)
    return await _enrich_popup(popup, db)


@router.delete("/{popup_id}/hard")
async def hard_delete_popup(popup_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Popup).where(Popup.id == popup_id))
    popup = result.scalar_one_or_none()
    if not popup:
        raise HTTPException(status_code=404, detail="Popup not found")

    await db.execute(delete(Popup).where(Popup.id == popup_id))
    await db.commit()
    return {"message": "Popup permanently deleted", "id": popup_id}
