"""
Admin Inventory Router — /api/admin/inventory/*
Inventory management (operates on the products table).
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_, literal, case
from app.config.database import get_db
from app.models.product import Product
from app.middleware.admin_auth import verify_admin
from app.utils.helpers import to_serializable

router = APIRouter()


@router.get("/")
async def get_all_inventory(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Product).order_by(Product.createdAt.desc()))
    products = result.scalars().all()
    return [to_serializable(p) for p in products]


@router.get("/low-stock")
async def get_low_stock_items(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(
        select(Product).where(Product.quantity <= 10)
    )
    products = result.scalars().all()
    return [to_serializable(p) for p in products]


@router.get("/{item_id}")
async def get_inventory_by_id(
    item_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Product).where(Product.id == item_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Inventory item not found")
    return to_serializable(product)


@router.post("/")
async def create_inventory_item(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    body = await request.json()
    product = Product(**body)
    db.add(product)
    await db.commit()
    await db.refresh(product)
    return to_serializable(product)


@router.put("/{item_id}")
async def update_inventory_item(
    item_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    body = await request.json()

    result = await db.execute(select(Product).where(Product.id == item_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    for key, value in body.items():
        if hasattr(product, key):
            setattr(product, key, value)

    await db.commit()
    await db.refresh(product)
    return to_serializable(product)


@router.delete("/{item_id}")
async def delete_inventory_item(
    item_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Product).where(Product.id == item_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Inventory item not found")

    await db.delete(product)
    await db.commit()
    return {"success": True}


@router.post("/search")
async def search_similar_items(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    body = await request.json()
    query = body.get("query", "")

    result = await db.execute(
        select(Product).where(
            or_(
                Product.name.ilike(f"%{query}%"),
                Product.category.ilike(f"%{query}%"),
                Product.sku.ilike(f"%{query}%"),
            )
        )
    )
    products = result.scalars().all()
    return [to_serializable(p) for p in products]
