"""
Standalone script to create all database tables in PostgreSQL (AWS RDS).

Usage:
    python create_tables.py

This script:
  1. Connects to the PostgreSQL database using credentials from .env
  2. Creates all required ENUM types (if they don't already exist)
  3. Creates all 6 tables: users, products, orders, customers, custom_orders, offer_subscribers
  4. Verifies the tables were created successfully
"""

import asyncio
import sys
from sqlalchemy import text
from app.config.database import engine, Base
from app.config.settings import get_settings

# Import all models so Base.metadata registers them
from app.models import User, Product, Order, Customer, CustomOrder, OfferSubscriber  # noqa: F401


# ── ENUM type definitions (must exist before tables reference them) ──────────
ENUM_STATEMENTS = [
    # orders.status
    """
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_status') THEN
            CREATE TYPE enum_orders_status AS ENUM (
                'pending', 'processing', 'shipped', 'delivered', 'cancelled'
            );
        END IF;
    END $$;
    """,
    # orders."paymentStatus"
    """
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_paymentStatus') THEN
            CREATE TYPE "enum_orders_paymentStatus" AS ENUM (
                'pending', 'paid', 'failed', 'refunded'
            );
        END IF;
    END $$;
    """,
    # orders."paymentMethod"
    """
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_orders_paymentMethod') THEN
            CREATE TYPE "enum_orders_paymentMethod" AS ENUM (
                'cod', 'razorpay', 'paypal'
            );
        END IF;
    END $$;
    """,
    # customers.status
    """
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_customers_status') THEN
            CREATE TYPE enum_customers_status AS ENUM (
                'active', 'inactive', 'blocked'
            );
        END IF;
    END $$;
    """,
    # custom_orders.status
    """
    DO $$ BEGIN
        IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_custom_orders_status') THEN
            CREATE TYPE enum_custom_orders_status AS ENUM (
                'pending', 'consulting', 'designing', 'production',
                'shipped', 'delivered', 'cancelled'
            );
        END IF;
    END $$;
    """,
]


async def create_all_tables():
    settings = get_settings()
    print("=" * 60)
    print("  Saaj Jewels — Database Table Creator")
    print("=" * 60)
    print(f"\n  Host     : {settings.Host}")
    print(f"  Port     : {settings.Port}")
    print(f"  Database : {settings.database_name}")
    print(f"  User     : {settings.Username}")
    print(f"  Region   : (from .env)")
    print()

    # Step 1: Test connectivity
    print("[1/4] Testing database connection...")
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text("SELECT 1"))
            val = result.scalar()
            print(f"       ✓ Connected successfully (SELECT 1 = {val})")
    except Exception as e:
        print(f"       ✗ Connection FAILED: {e}")
        print("\n  Please check your .env credentials and ensure the RDS instance is accessible.")
        await engine.dispose()
        sys.exit(1)

    # Step 2: Create ENUM types
    print("\n[2/4] Creating ENUM types...")
    try:
        async with engine.begin() as conn:
            for stmt in ENUM_STATEMENTS:
                await conn.execute(text(stmt))
        print("       ✓ All ENUM types created (or already exist)")
    except Exception as e:
        print(f"       ✗ ENUM creation failed: {e}")
        await engine.dispose()
        sys.exit(1)

    # Step 3: Create all tables
    print("\n[3/4] Creating tables...")
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        print("       ✓ All tables created successfully")
    except Exception as e:
        print(f"       ✗ Table creation failed: {e}")
        await engine.dispose()
        sys.exit(1)

    # Step 4: Verify tables
    print("\n[4/4] Verifying tables...")
    try:
        async with engine.begin() as conn:
            result = await conn.execute(text(
                "SELECT table_name FROM information_schema.tables "
                "WHERE table_schema = 'public' ORDER BY table_name"
            ))
            tables = [row[0] for row in result.fetchall()]

            # Also list ENUM types
            enum_result = await conn.execute(text(
                "SELECT typname FROM pg_type WHERE typtype = 'e' ORDER BY typname"
            ))
            enums = [row[0] for row in enum_result.fetchall()]

        print(f"\n  Tables in database ({len(tables)}):")
        expected_tables = ["users", "products", "orders", "customers", "custom_orders", "offer_subscribers"]
        for t in tables:
            marker = "✓" if t in expected_tables else " "
            print(f"    [{marker}] {t}")

        print(f"\n  ENUM types ({len(enums)}):")
        for e in enums:
            print(f"    • {e}")

        # Check for missing tables
        missing = [t for t in expected_tables if t not in tables]
        if missing:
            print(f"\n  ⚠ Missing tables: {missing}")
        else:
            print(f"\n  ✓ All {len(expected_tables)} expected tables are present!")

    except Exception as e:
        print(f"       ✗ Verification failed: {e}")

    await engine.dispose()
    print("\n" + "=" * 60)
    print("  Done! Database is ready for Saaj Jewels backend.")
    print("=" * 60)


if __name__ == "__main__":
    asyncio.run(create_all_tables())
