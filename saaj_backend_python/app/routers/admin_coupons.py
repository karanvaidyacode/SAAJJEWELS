"""
Admin Coupons Router — /api/admin/coupons/*
Full CRUD with soft-delete and hard-delete support.
"""

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, delete
from datetime import datetime

from app.config.database import get_db
from app.middleware.admin_auth import verify_admin
from app.models.coupon import Coupon
from app.schemas.coupon import CouponCreate, CouponUpdate, CouponOut

router = APIRouter(dependencies=[Depends(verify_admin)])


@router.get("/")
async def list_coupons(
    include_deleted: bool = Query(False),
    db: AsyncSession = Depends(get_db),
):
    query = select(Coupon).order_by(Coupon.createdAt.desc())
    if not include_deleted:
        query = query.where(Coupon.isDeleted == False)
    result = await db.execute(query)
    coupons = result.scalars().all()
    return {"coupons": [CouponOut.model_validate(c) for c in coupons]}


@router.get("/stats")
async def coupon_stats(db: AsyncSession = Depends(get_db)):
    base = select(Coupon).where(Coupon.isDeleted == False)

    total_result = await db.execute(select(func.count()).select_from(base.subquery()))
    total = total_result.scalar() or 0

    active_result = await db.execute(
        select(func.count()).select_from(
            base.where(Coupon.isActive == True).subquery()
        )
    )
    active = active_result.scalar() or 0

    used_result = await db.execute(
        select(func.coalesce(func.sum(Coupon.usedCount), 0)).where(Coupon.isDeleted == False)
    )
    total_uses = used_result.scalar() or 0

    return {
        "totalCoupons": total,
        "activeCoupons": active,
        "totalUses": total_uses,
    }


@router.get("/{coupon_id}")
async def get_coupon(coupon_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")
    return CouponOut.model_validate(coupon)


@router.post("/", status_code=201)
async def create_coupon(body: CouponCreate, db: AsyncSession = Depends(get_db)):
    existing = await db.execute(
        select(Coupon).where(Coupon.code == body.code.strip().upper())
    )
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Coupon code already exists")

    coupon = Coupon(**body.model_dump())
    db.add(coupon)
    await db.commit()
    await db.refresh(coupon)
    return CouponOut.model_validate(coupon)


@router.put("/{coupon_id}")
async def update_coupon(
    coupon_id: int, body: CouponUpdate, db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(coupon, key, value)

    await db.commit()
    await db.refresh(coupon)
    return CouponOut.model_validate(coupon)


@router.patch("/{coupon_id}/toggle")
async def toggle_coupon(coupon_id: int, db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    coupon.isActive = not coupon.isActive
    await db.commit()
    await db.refresh(coupon)
    return CouponOut.model_validate(coupon)


@router.delete("/{coupon_id}/soft")
async def soft_delete_coupon(coupon_id: int, db: AsyncSession = Depends(get_db)):
    """Mark a coupon as deleted without removing from DB."""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    coupon.isDeleted = True
    coupon.isActive = False
    coupon.deletedAt = datetime.utcnow()
    await db.commit()
    return {"message": "Coupon soft-deleted", "id": coupon_id}


@router.post("/{coupon_id}/restore")
async def restore_coupon(coupon_id: int, db: AsyncSession = Depends(get_db)):
    """Restore a soft-deleted coupon."""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    coupon.isDeleted = False
    coupon.deletedAt = None
    await db.commit()
    await db.refresh(coupon)
    return CouponOut.model_validate(coupon)


@router.delete("/{coupon_id}/hard")
async def hard_delete_coupon(coupon_id: int, db: AsyncSession = Depends(get_db)):
    """Permanently remove a coupon from the database."""
    result = await db.execute(select(Coupon).where(Coupon.id == coupon_id))
    coupon = result.scalar_one_or_none()
    if not coupon:
        raise HTTPException(status_code=404, detail="Coupon not found")

    await db.execute(delete(Coupon).where(Coupon.id == coupon_id))
    await db.commit()
    return {"message": "Coupon permanently deleted", "id": coupon_id}
