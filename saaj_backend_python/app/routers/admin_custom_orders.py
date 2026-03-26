"""
Admin Custom Orders Router — /api/admin/custom-orders/*
CRUD for custom jewelry orders.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_

from app.config.database import get_db
from app.models.custom_order import CustomOrder
from app.schemas.custom_order import CustomOrderCreate, CustomOrderUpdate, CustomOrderStatusUpdate
from app.middleware.admin_auth import verify_admin
from app.utils.helpers import to_serializable

router = APIRouter()


@router.get("/")
async def get_all_custom_orders(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(CustomOrder).order_by(CustomOrder.createdAt.desc()))
    orders = result.scalars().all()
    return [to_serializable(o) for o in orders]


@router.get("/{order_id}")
async def get_custom_order_by_id(
    order_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(CustomOrder).where(CustomOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Custom order not found")
    return to_serializable(order)


@router.post("/")
async def create_custom_order(
    body: CustomOrderCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    order = CustomOrder(
        customerName=body.customerName,
        customerEmail=body.customerEmail,
        customerPhone=body.customerPhone,
        designDescription=body.designDescription,
        materials=body.materials or [],
        budgetRange=body.budgetRange,
        referenceImages=body.referenceImages or [],
        status="pending",
    )
    db.add(order)
    await db.commit()
    await db.refresh(order)
    return to_serializable(order)


@router.put("/{order_id}")
async def update_custom_order(
    order_id: int,
    body: CustomOrderUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(select(CustomOrder).where(CustomOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Custom order not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(order, key):
            setattr(order, key, value)

    await db.commit()
    await db.refresh(order)
    return to_serializable(order)


@router.put("/{order_id}/status")
async def update_custom_order_status(
    order_id: int,
    body: CustomOrderStatusUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(select(CustomOrder).where(CustomOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Custom order not found")

    order.status = body.status
    await db.commit()
    await db.refresh(order)
    return to_serializable(order)


@router.delete("/{order_id}")
async def delete_custom_order(
    order_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(select(CustomOrder).where(CustomOrder.id == order_id))
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Custom order not found")

    await db.delete(order)
    await db.commit()
    return {"success": True}


@router.post("/search")
async def search_similar_custom_orders(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    body = await request.json()
    query = body.get("query", "")

    result = await db.execute(
        select(CustomOrder).where(
            or_(
                CustomOrder.customerName.ilike(f"%{query}%"),
                CustomOrder.customerEmail.ilike(f"%{query}%"),
                CustomOrder.designDescription.ilike(f"%{query}%"),
            )
        )
    )
    orders = result.scalars().all()
    return [to_serializable(o) for o in orders]
