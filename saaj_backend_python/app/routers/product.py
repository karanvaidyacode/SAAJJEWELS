"""
Product Router — /api/products/*
Public product listing + admin CRUD with S3 media upload.
Supports soft delete (toggle isActive) and hard delete (permanent + S3 cleanup).
"""

from fastapi import APIRouter, Depends, HTTPException, Request, UploadFile, File, Form
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_, func
from typing import Optional, List
from decimal import Decimal
import json
import logging

from app.config.database import get_db
from app.models.product import Product
from app.middleware.admin_auth import verify_admin
from app.services.s3_upload import upload_files_to_s3, delete_file_from_s3
from app.utils.helpers import to_serializable

router = APIRouter()
logger = logging.getLogger(__name__)


# ============ Public Routes ============

@router.get("/products/search")
async def search_products(
    q: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    if not q or q.strip() == "":
        return []

    search_term = f"%{q}%"
    result = await db.execute(
        select(Product).where(
            Product.isActive == True,  # Only search active products
            or_(
                Product.name.ilike(search_term),
                Product.category.ilike(search_term),
                Product.description.ilike(search_term),
            )
        )
    )
    products = result.scalars().all()
    return [to_serializable(p) for p in products]


@router.get("/products")
async def get_all_products(
    page: Optional[int] = None,
    limit: Optional[int] = None,
    category: Optional[str] = None,
    db: AsyncSession = Depends(get_db),
):
    """Public endpoint — returns only active products with optional pagination."""
    query = select(Product).where(Product.isActive == True)

    if category:
        query = query.where(Product.category == category)

    if page is not None and limit is not None:
        page = max(1, page)
        limit = min(max(1, limit), 100)
        count_result = await db.execute(
            select(func.count(Product.id)).where(Product.isActive == True)
        )
        total = count_result.scalar() or 0
        query = query.offset((page - 1) * limit).limit(limit)
        result = await db.execute(query)
        products = result.scalars().all()
        return {
            "products": [to_serializable(p) for p in products],
            "total": total,
            "page": page,
            "limit": limit,
            "pages": (total + limit - 1) // limit,
        }

    result = await db.execute(query)
    products = result.scalars().all()
    return [to_serializable(p) for p in products]


@router.get("/products/{product_id}")
async def get_product_by_id(
    product_id: int,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return to_serializable(product)


@router.post("/products/upload-media")
async def upload_media(
    media: List[UploadFile] = File(...),
):
    """Upload media files to S3 and return URLs."""
    if not media:
        raise HTTPException(status_code=400, detail="No files uploaded")

    uploaded = await upload_files_to_s3(media)
    return {"media": uploaded}


# ============ Admin Routes ============

@router.get("/products/admin/all")
async def get_all_products_admin(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Admin endpoint — returns ALL products including soft-deleted (inactive) ones."""
    await verify_admin(request)
    result = await db.execute(select(Product))
    products = result.scalars().all()
    return [to_serializable(p) for p in products]


@router.post("/products")
async def create_product(
    request: Request,
    name: str = Form(...),
    originalPrice: str = Form(...),
    discountedPrice: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    quantity: str = Form("0"),
    rating: str = Form("4.5"),
    sku: Optional[str] = Form(None),
    targetWidth: Optional[str] = Form(None),
    targetHeight: Optional[str] = Form(None),
    media: List[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    # Validate
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
    if not description or not description.strip():
        raise HTTPException(status_code=400, detail="Product description is required")
    if not category or not category.strip():
        raise HTTPException(status_code=400, detail="Product category is required")

    try:
        parsed_original = float(originalPrice)
        parsed_discounted = float(discountedPrice)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Prices must be valid numbers")

    # Upload media to S3
    media_items = []
    if media and media[0].filename:
        media_items = await upload_files_to_s3(media)
    else:
        raise HTTPException(
            status_code=400,
            detail="At least one image or video is required for product creation.",
        )

    product = Product(
        name=name.strip(),
        originalPrice=Decimal(str(parsed_original)),
        discountedPrice=Decimal(str(parsed_discounted)),
        media=media_items,
        quantity=int(quantity) if quantity else 0,
        description=description.strip(),
        category=category.strip(),
        rating=Decimal(str(float(rating))) if rating else Decimal("4.5"),
        reviews=0,
        sku=sku if sku else None,
        isActive=True,
    )

    db.add(product)
    await db.commit()
    await db.refresh(product)

    return to_serializable(product)


@router.put("/products/{product_id}")
async def update_product(
    product_id: int,
    request: Request,
    name: str = Form(...),
    originalPrice: str = Form(...),
    discountedPrice: str = Form(...),
    description: str = Form(...),
    category: str = Form(...),
    quantity: str = Form("0"),
    rating: str = Form("4.5"),
    sku: Optional[str] = Form(None),
    targetWidth: Optional[str] = Form(None),
    targetHeight: Optional[str] = Form(None),
    media_json: Optional[str] = Form(None, alias="media"),
    media: List[UploadFile] = File(None),
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    # Validate
    if not name or not name.strip():
        raise HTTPException(status_code=400, detail="Product name is required")
    if not description or not description.strip():
        raise HTTPException(status_code=400, detail="Product description is required")
    if not category or not category.strip():
        raise HTTPException(status_code=400, detail="Product category is required")

    try:
        parsed_original = float(originalPrice)
        parsed_discounted = float(discountedPrice)
    except (ValueError, TypeError):
        raise HTTPException(status_code=400, detail="Prices must be valid numbers")

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Process existing media from JSON
    existing_media = []
    if media_json:
        try:
            existing_media = json.loads(media_json) if isinstance(media_json, str) else media_json
        except (json.JSONDecodeError, TypeError):
            existing_media = []

    # Upload new files to S3
    if media and media[0].filename:
        new_media = await upload_files_to_s3(media)
        existing_media = existing_media + new_media

    # Update fields
    product.name = name.strip()
    product.originalPrice = Decimal(str(parsed_original))
    product.discountedPrice = Decimal(str(parsed_discounted))
    product.description = description.strip()
    product.category = category.strip()
    product.quantity = int(quantity) if quantity else 0
    product.rating = Decimal(str(float(rating))) if rating else product.rating
    product.sku = sku if sku else product.sku

    if existing_media:
        product.media = existing_media

    await db.commit()
    await db.refresh(product)

    return to_serializable(product)


# ──────── Soft Delete (Toggle Active/Inactive) ────────

@router.patch("/products/{product_id}/toggle-active")
async def toggle_product_active(
    product_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Soft delete / restore a product.
    Toggles the isActive flag. Inactive products are hidden from the website
    but remain in the database and can be reactivated.
    """
    await verify_admin(request)

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.isActive = not product.isActive
    await db.commit()
    await db.refresh(product)

    status = "activated" if product.isActive else "deactivated"
    return {
        "success": True,
        "message": f"Product {status} successfully",
        "isActive": product.isActive,
    }


# ──────── Hard Delete (Permanent + S3 Cleanup) ────────

@router.delete("/products/{product_id}")
async def delete_product(
    product_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Permanently delete a product and remove all its media from S3.
    This action cannot be undone.
    """
    await verify_admin(request)

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    # Delete all media from S3
    if product.media:
        for item in product.media:
            s3_key = item.get("s3_key") or item.get("public_id", "")
            if s3_key and "saajjewels_media/" in s3_key:
                try:
                    delete_file_from_s3(s3_key)
                    logger.info(f"Deleted S3 media: {s3_key}")
                except Exception as e:
                    logger.error(f"Failed to delete S3 file {s3_key}: {e}")

    await db.delete(product)
    await db.commit()

    return {"success": True, "message": "Product permanently deleted"}


# ──────── Per-Image Management ────────

@router.post("/products/{product_id}/media")
async def add_product_media(
    product_id: int,
    request: Request,
    media: List[UploadFile] = File(...),
    db: AsyncSession = Depends(get_db),
):
    """Add additional images/videos to an existing product."""
    await verify_admin(request)

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not media or not media[0].filename:
        raise HTTPException(status_code=400, detail="No files provided")

    new_items = await upload_files_to_s3(media)
    existing = product.media or []
    product.media = existing + new_items

    await db.commit()
    await db.refresh(product)

    return to_serializable(product)


@router.delete("/products/{product_id}/media/{media_index}")
async def remove_product_media(
    product_id: int,
    media_index: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Remove a specific image/video from a product by its index in the media array.
    Also deletes the file from S3.
    """
    await verify_admin(request)

    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    if not product.media or media_index < 0 or media_index >= len(product.media):
        raise HTTPException(status_code=400, detail="Invalid media index")

    # Get the item to delete from S3
    removed_item = product.media[media_index]
    s3_key = removed_item.get("s3_key") or removed_item.get("public_id", "")

    # Remove from the media list
    updated_media = [m for i, m in enumerate(product.media) if i != media_index]
    product.media = updated_media

    # Delete from S3
    if s3_key and "saajjewels_media/" in s3_key:
        try:
            delete_file_from_s3(s3_key)
            logger.info(f"Deleted S3 media: {s3_key}")
        except Exception as e:
            logger.error(f"Failed to delete S3 file {s3_key}: {e}")

    await db.commit()
    await db.refresh(product)

    return to_serializable(product)
