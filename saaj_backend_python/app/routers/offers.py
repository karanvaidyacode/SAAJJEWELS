"""
Offers Router — /offers/*
Manages offer subscriptions, coupon claiming, and tracking remaining offers.
"""

from fastapi import APIRouter, Depends, HTTPException, Query, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from app.config.database import get_db
from app.models.offer_subscriber import OfferSubscriber
from app.schemas.offer import OfferSubscribeRequest, OfferClaimRequest
from app.services.email import send_email
from app.middleware.admin_auth import verify_admin

router = APIRouter()

INITIAL_OFFER_COUNT = 5


@router.post("/subscribe")
async def subscribe_to_offers(
    body: OfferSubscribeRequest,
    db: AsyncSession = Depends(get_db),
):
    email = body.email.lower()

    # Check if already subscribed
    result = await db.execute(
        select(OfferSubscriber).where(OfferSubscriber.email == email)
    )
    existing = result.scalar_one_or_none()

    count_result = await db.execute(select(func.count(OfferSubscriber.id)))
    subscriber_count = count_result.scalar() or 0

    if existing:
        return {
            "message": "This email has already claimed the offer",
            "couponCode": "SAAJ10",
            "remainingOffers": max(0, INITIAL_OFFER_COUNT - subscriber_count),
        }

    if subscriber_count >= INITIAL_OFFER_COUNT:
        raise HTTPException(
            status_code=400,
            detail={
                "message": "Sorry, all offers have been claimed",
                "remainingOffers": 0,
            },
        )

    # Create subscriber
    new_sub = OfferSubscriber(email=email)
    db.add(new_sub)
    await db.commit()

    new_count_result = await db.execute(select(func.count(OfferSubscriber.id)))
    new_count = new_count_result.scalar() or 0
    remaining = max(0, INITIAL_OFFER_COUNT - new_count)

    # Send coupon email
    await send_email(
        to=email,
        subject="10% OFF Your SaajJewels Order",
        html="""
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #c6a856;">Thank You for Subscribing to SaajJewels!</h2>
            <p>We're excited to have you join our community. As promised, here's your coupon code:</p>
            <div style="background-color: #f5f5f5; padding: 15px; text-align: center; margin: 20px 0;">
                <span style="font-size: 24px; font-weight: bold; letter-spacing: 2px; color: #333;">SAAJ10</span>
            </div>
            <p>Use this code at checkout to get <strong>10% off</strong> your next order.</p>
            <p>Happy shopping!</p>
            <p>The SaajJewels Team</p>
        </div>
        """,
    )

    return {
        "message": "Successfully subscribed",
        "couponCode": "SAAJ10",
        "remainingOffers": remaining,
    }


@router.get("/subscribers")
async def get_subscribed_emails(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(
        select(OfferSubscriber).order_by(OfferSubscriber.createdAt.desc())
    )
    subscribers = result.scalars().all()
    return {
        "count": len(subscribers),
        "emails": [s.email for s in subscribers],
    }


@router.get("/remaining")
async def get_remaining_offers(db: AsyncSession = Depends(get_db)):
    count_result = await db.execute(select(func.count(OfferSubscriber.id)))
    subscriber_count = count_result.scalar() or 0
    remaining = max(0, INITIAL_OFFER_COUNT - subscriber_count)
    return {
        "remainingOffers": remaining,
        "totalOffers": INITIAL_OFFER_COUNT,
    }


@router.get("/check")
async def check_email_claimed(
    email: str = Query(...),
    db: AsyncSession = Depends(get_db),
):
    if not email:
        raise HTTPException(status_code=400, detail="Email is required")

    result = await db.execute(
        select(OfferSubscriber).where(OfferSubscriber.email == email.lower())
    )
    subscriber = result.scalar_one_or_none()

    count_result = await db.execute(select(func.count(OfferSubscriber.id)))
    subscriber_count = count_result.scalar() or 0

    return {
        "claimed": subscriber is not None,
        "remainingOffers": max(0, INITIAL_OFFER_COUNT - subscriber_count),
    }


@router.post("/claim")
async def claim_offer(
    body: OfferClaimRequest,
    db: AsyncSession = Depends(get_db),
):
    if body.email:
        email_lower = body.email.lower()
        result = await db.execute(
            select(OfferSubscriber).where(OfferSubscriber.email == email_lower)
        )
        existing = result.scalar_one_or_none()

        if not existing:
            count_result = await db.execute(select(func.count(OfferSubscriber.id)))
            subscriber_count = count_result.scalar() or 0
            if subscriber_count < INITIAL_OFFER_COUNT:
                new_sub = OfferSubscriber(email=email_lower)
                db.add(new_sub)
                await db.commit()

    count_result = await db.execute(select(func.count(OfferSubscriber.id)))
    count = count_result.scalar() or 0
    remaining = max(0, INITIAL_OFFER_COUNT - count)

    return {"success": True, "remainingOffers": remaining}
