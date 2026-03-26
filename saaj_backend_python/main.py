"""
Saaj Jewels — Python FastAPI Backend
Entry point: uvicorn main:app --reload
"""

from contextlib import asynccontextmanager
from fastapi import FastAPI, Request, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import text
from slowapi import Limiter
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
import logging

from app.config.database import engine, Base
from app.config.settings import get_settings

# Import all models so Base.metadata picks them up
from app.models import User, Product, Order, Customer, CustomOrder, OfferSubscriber, Coupon, Popup  # noqa: F401

# Import routers
from app.routers import (
    auth,
    offers,
    user,
    product,
    admin_orders,
    admin_customers,
    admin_inventory,
    admin_custom_orders,
    admin_analytics,
    admin_branding,
    admin_payments,
    admin_coupons,
    admin_popups,
    coupons,
    popups,
    contact,
    razorpay,
    sitemap,
)

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application startup / shutdown lifecycle."""
    logger.info("Starting Saaj Jewels Backend...")

    # Quick connectivity test
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            logger.info(f"Database connected: {result.scalar()}")
    except Exception as e:
        logger.error(f"Database connection failed: {e}")

    # Create ENUM types first (PostgreSQL requires them before table creation)
    enum_statements = [
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_status') THEN CREATE TYPE enum_orders_status AS ENUM ('pending','processing','shipped','delivered','cancelled'); END IF; END $$;",
        """DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_paymentStatus') THEN CREATE TYPE "enum_orders_paymentStatus" AS ENUM ('pending','paid','failed','refunded'); END IF; END $$;""",
        """DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_paymentMethod') THEN CREATE TYPE "enum_orders_paymentMethod" AS ENUM ('cod','razorpay','paypal','coupon'); END IF; END $$;""",
        """DO $$ BEGIN ALTER TYPE "enum_orders_paymentMethod" ADD VALUE IF NOT EXISTS 'coupon'; EXCEPTION WHEN duplicate_object THEN NULL; END $$;""",
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_customers_status') THEN CREATE TYPE enum_customers_status AS ENUM ('active','inactive','blocked'); END IF; END $$;",
        "DO $$ BEGIN IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_custom_orders_status') THEN CREATE TYPE enum_custom_orders_status AS ENUM ('pending','consulting','designing','production','shipped','delivered','cancelled'); END IF; END $$;",
    ]

    try:
        async with engine.begin() as conn:
            for stmt in enum_statements:
                await conn.execute(text(stmt))
            await conn.run_sync(Base.metadata.create_all)

            # Add isActive column to products table if it doesn't exist
            await conn.execute(text(
                """DO $$ BEGIN
                    ALTER TABLE products ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END $$;"""
            ))

            # Add couponCode column to orders table if it doesn't exist
            await conn.execute(text(
                """DO $$ BEGIN
                    ALTER TABLE orders ADD COLUMN "couponCode" VARCHAR;
                EXCEPTION
                    WHEN duplicate_column THEN NULL;
                END $$;"""
            ))

        logger.info("Database ENUM types and tables synced successfully")
    except Exception as e:
        logger.error(f"Database table sync failed: {e}")

    yield  # App runs here

    # Shutdown
    await engine.dispose()
    logger.info("Saaj Jewels Backend shut down")


import os

_is_production = os.getenv("ENVIRONMENT", "development").lower() == "production"

limiter = Limiter(key_func=get_remote_address, default_limits=["120/minute"])


def _rate_limit_exceeded_handler(request: Request, exc: RateLimitExceeded):
    return JSONResponse(
        status_code=429,
        content={"detail": "Too many requests. Please try again later."},
    )


app = FastAPI(
    title="Saaj Jewels API",
    description="E-commerce backend for Saaj Jewels",
    version="2.0.0",
    lifespan=lifespan,
    docs_url=None if _is_production else "/docs",
    redoc_url=None if _is_production else "/redoc",
    openapi_url=None if _is_production else "/openapi.json",
)

app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS configuration
_allowed_origins = [
    "https://saajjewel.in",
    "https://www.saajjewel.in",
    "http://localhost:3000",
    "http://localhost:5173",
]
if settings.CORS_ORIGINS:
    _allowed_origins = [o.strip() for o in settings.CORS_ORIGINS.split(",") if o.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization", "x-admin-token", "x-user-email"],
)


# ──────── Route Mounts ────────
# API Route Mounts:

# Auth routes → /auth/*
app.include_router(auth.router, prefix="/auth", tags=["Auth"])

# Offer routes → /offers/*
app.include_router(offers.router, prefix="/offers", tags=["Offers"])

# User cart/addresses/orders → /api/*
app.include_router(user.router, prefix="/api", tags=["User"])

# Products (public + admin) → /api/*
app.include_router(product.router, prefix="/api", tags=["Products"])

# Admin Orders → /api/admin/orders/*
app.include_router(admin_orders.router, prefix="/api/admin/orders", tags=["Admin Orders"])

# Admin Customers → /api/admin/customers/*
app.include_router(admin_customers.router, prefix="/api/admin/customers", tags=["Admin Customers"])

# Admin Inventory → /api/admin/inventory/*
app.include_router(admin_inventory.router, prefix="/api/admin/inventory", tags=["Admin Inventory"])

# Admin Custom Orders → /api/admin/custom-orders/*
app.include_router(admin_custom_orders.router, prefix="/api/admin/custom-orders", tags=["Admin Custom Orders"])

# Admin Analytics → /api/admin/analytics/*
app.include_router(admin_analytics.router, prefix="/api/admin/analytics", tags=["Admin Analytics"])

# Admin Branding → /api/admin/branding/*
app.include_router(admin_branding.router, prefix="/api/admin/branding", tags=["Admin Branding"])

# Admin Payments → /api/admin/payments/*
app.include_router(admin_payments.router, prefix="/api/admin/payments", tags=["Admin Payments"])

# Admin Coupons → /api/admin/coupons/*
app.include_router(admin_coupons.router, prefix="/api/admin/coupons", tags=["Admin Coupons"])

# Admin Popups → /api/admin/popups/*
app.include_router(admin_popups.router, prefix="/api/admin/popups", tags=["Admin Popups"])

# Public Coupons → /api/coupons/*
app.include_router(coupons.router, prefix="/api/coupons", tags=["Coupons"])

# Public Popups → /api/popups/*
app.include_router(popups.router, prefix="/api/popups", tags=["Popups"])

# Contact → /api/contact/*
app.include_router(contact.router, prefix="/api/contact", tags=["Contact"])

# Razorpay → /api/razorpay/*
app.include_router(razorpay.router, prefix="/api/razorpay", tags=["Razorpay"])

# Sitemap → /api/sitemap.xml
app.include_router(sitemap.router, prefix="/api", tags=["SEO"])


# ──────── Admin Token Verification Endpoint ────────
@app.post("/api/admin/verify-token")
@limiter.limit("10/minute")
async def verify_admin_token(request: Request):
    """
    Verify the admin token sent from the frontend.
    The admin token is stored server-side in the ADMIN_TOKEN env var
    and is NEVER exposed to the frontend.
    """
    token = request.headers.get("x-admin-token", "")
    if not settings.ADMIN_TOKEN:
        raise HTTPException(status_code=500, detail="Admin token not configured on server")
    if token == settings.ADMIN_TOKEN:
        return {"valid": True}
    raise HTTPException(status_code=401, detail="Invalid admin token")


# ──────── Root Health Endpoint ────────
@app.get("/")
async def root():
    return {
        "message": "Saaj Jewels API is running",
        "version": "2.0.0",
        "docs": "/docs",
    }


@app.get("/health")
async def health_check():
    return {"status": "healthy"}


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=5000, reload=True)
