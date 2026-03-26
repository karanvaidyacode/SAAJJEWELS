"""
Auth Router — /auth/*
Replaces OTP-based auth with Clerk authentication.
Clerk handles signup/login on the frontend; the backend only verifies JWT tokens.
"""

from fastapi import APIRouter, Depends, Request
from app.middleware.clerk_auth import verify_clerk_token, get_clerk_user_email, get_clerk_user_id
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from app.config.database import get_db
from app.models.user import User

router = APIRouter()


@router.get("/me")
async def get_current_user(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """
    Get the currently authenticated user's info from Clerk JWT.
    Creates a local user record if one doesn't exist.
    """
    claims = await verify_clerk_token(request)
    clerk_id = get_clerk_user_id(claims)
    email = get_clerk_user_email(claims)

    # Try to find user by clerk_id first, then by email
    result = await db.execute(select(User).where(User.clerk_id == clerk_id))
    user = result.scalar_one_or_none()

    if not user and email:
        result = await db.execute(select(User).where(User.email == email))
        user = result.scalar_one_or_none()

    # Create user if not found
    if not user:
        user = User(
            email=email or f"{clerk_id}@clerk.user",
            clerk_id=clerk_id,
            firstName=claims.get("first_name") or claims.get("name", "").split(" ")[0] if claims.get("name") else None,
            lastName=claims.get("last_name") or (claims.get("name", "").split(" ")[-1] if claims.get("name") and " " in claims.get("name", "") else None),
            profilePicture=claims.get("image_url") or claims.get("profile_image_url"),
            isVerified=True,
            cart=[],
            addresses=[],
            orders=[],
        )
        db.add(user)
        await db.commit()
        await db.refresh(user)
    elif not user.clerk_id:
        # Link clerk_id to existing email-based user
        user.clerk_id = clerk_id
        await db.commit()

    name = None
    if user.firstName and user.lastName:
        name = f"{user.firstName} {user.lastName}".strip()
    elif user.firstName:
        name = user.firstName
    elif email:
        name = email.split("@")[0]

    return {
        "message": "Authenticated",
        "user": {
            "id": user.email,
            "email": user.email,
            "name": name,
            "profilePicture": user.profilePicture,
        }
    }


@router.get("/test/health")
async def auth_health():
    """Test endpoint to check auth service health."""
    return {"message": "Auth service is healthy", "provider": "Clerk"}
