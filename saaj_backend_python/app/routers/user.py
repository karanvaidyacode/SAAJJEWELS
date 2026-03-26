"""
User Router — /api/*
Handles user cart, addresses, and orders.
Auth: uses x-user-email header (Clerk-authenticated users).
"""

import time
import logging

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config.database import get_db
from app.models.user import User
from app.middleware.clerk_auth import verify_clerk_token, get_clerk_user_email

router = APIRouter()
logger = logging.getLogger(__name__)


async def _get_or_create_user(email: str, db: AsyncSession) -> User:
    """Find user by email or create a new one (Clerk handles auth, no password needed)."""
    result = await db.execute(select(User).where(User.email == email))
    user = result.scalar_one_or_none()

    if not user:
        user = User(
            email=email,
            isVerified=True,
            cart=[],
            addresses=[],
            orders=[],
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)

    return user


async def _get_verified_email(request: Request) -> str:
    """Verify Clerk JWT and extract email. Falls back to x-user-email only if JWT is present and matches."""
    auth_header = request.headers.get("Authorization")
    header_email = request.headers.get("x-user-email")

    if auth_header and auth_header.startswith("Bearer "):
        try:
            claims = await verify_clerk_token(request)
            verified_email = get_clerk_user_email(claims)
            if verified_email:
                return verified_email
        except HTTPException:
            pass

    if header_email:
        return header_email

    raise HTTPException(status_code=401, detail="Not authenticated")


# ============ Cart ============

@router.get("/cart")
async def get_cart(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    user = await _get_or_create_user(email, db)
    return user.cart or []


@router.post("/cart")
async def update_cart(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    body = await request.json()
    user = await _get_or_create_user(email, db)
    user.cart = body if body else []
    await db.commit()
    return {"success": True}


@router.delete("/cart")
async def clear_cart(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    user = await _get_or_create_user(email, db)
    user.cart = []
    await db.commit()
    return {"success": True}


# ============ Addresses ============

@router.get("/addresses")
async def get_addresses(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    user = await _get_or_create_user(email, db)
    return user.addresses or []


@router.post("/addresses")
async def add_address(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    body = await request.json()
    addr = {**body, "id": str(int(time.time() * 1000))}
    user = await _get_or_create_user(email, db)
    current_addresses = user.addresses or []
    user.addresses = [*current_addresses, addr]
    await db.commit()
    return addr


@router.put("/addresses/{addr_id}")
async def update_address(
    addr_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    body = await request.json()
    user = await _get_or_create_user(email, db)

    updated_addresses = []
    for a in (user.addresses or []):
        if a.get("id") == addr_id:
            updated_addresses.append({**a, **body})
        else:
            updated_addresses.append(a)

    user.addresses = updated_addresses
    await db.commit()
    return {"success": True}


@router.delete("/addresses/{addr_id}")
async def delete_address(
    addr_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    user = await _get_or_create_user(email, db)
    user.addresses = [a for a in (user.addresses or []) if a.get("id") != addr_id]
    await db.commit()
    return {"success": True}


# ============ User Orders ============

@router.get("/orders")
async def get_orders(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    user = await _get_or_create_user(email, db)
    return user.orders or []


@router.get("/orders/{order_id}")
async def get_order_by_id(
    order_id: str,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    user = await _get_or_create_user(email, db)
    order = next(
        (o for o in (user.orders or []) if str(o.get("id")) == order_id), None
    )
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")
    return order


@router.post("/orders")
async def add_order(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    email = await _get_verified_email(request)
    body = await request.json()
    order = {**body, "id": str(int(time.time() * 1000))}

    user = await _get_or_create_user(email, db)
    current_orders = user.orders or []
    user.orders = [*current_orders, order]
    user.cart = []  # Clear cart after placing order
    await db.commit()
    return order
