"""
Admin Customers Router — /api/admin/customers/*
CRUD for customers + analytics.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func
from datetime import datetime, timedelta
from decimal import Decimal

from app.config.database import get_db
from app.models.customer import Customer
from app.schemas.customer import CustomerCreate, CustomerUpdate
from app.middleware.admin_auth import verify_admin
from app.utils.helpers import to_serializable

router = APIRouter()


@router.get("/")
async def get_customers(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Customer).order_by(Customer.createdAt.desc()))
    customers = result.scalars().all()
    return [to_serializable(c) for c in customers]


@router.get("/analytics")
async def get_customer_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    total = await db.execute(select(func.count(Customer.id)))
    total_customers = total.scalar() or 0

    active_result = await db.execute(
        select(func.count(Customer.id)).where(Customer.status == "active")
    )
    active_customers = active_result.scalar() or 0

    inactive_result = await db.execute(
        select(func.count(Customer.id)).where(Customer.status == "inactive")
    )
    inactive_customers = inactive_result.scalar() or 0

    # Customer growth (last 6 months)
    six_months_ago = datetime.utcnow() - timedelta(days=180)
    month_label = func.to_char(Customer.createdAt, "YYYY-MM").label("month")
    growth_result = await db.execute(
        select(
            month_label,
            func.count(Customer.id).label("count"),
        )
        .where(Customer.createdAt >= six_months_ago)
        .group_by(month_label)
        .order_by(month_label.asc())
    )
    customer_growth = [
        {"month": row.month, "count": int(row.count)}
        for row in growth_result.all()
    ]

    return {
        "totalCustomers": total_customers,
        "activeCustomers": active_customers,
        "inactiveCustomers": inactive_customers,
        "customerGrowth": customer_growth,
    }


@router.get("/{customer_id}")
async def get_customer_by_id(
    customer_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return to_serializable(customer)


@router.post("/")
async def create_customer(
    body: CustomerCreate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    customer = Customer(
        name=body.name,
        email=body.email,
        phone=body.phone,
        address=body.address,
        totalOrders=body.totalOrders or 0,
        totalSpent=body.totalSpent or Decimal("0"),
        status=body.status or "active",
    )
    db.add(customer)
    await db.commit()
    await db.refresh(customer)
    return to_serializable(customer)


@router.put("/{customer_id}")
async def update_customer(
    customer_id: int,
    body: CustomerUpdate,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    update_data = body.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        if hasattr(customer, key):
            setattr(customer, key, value)

    await db.commit()
    await db.refresh(customer)

    return {
        "success": True,
        "message": "Customer updated successfully",
        "customer": to_serializable(customer),
    }


@router.delete("/{customer_id}")
async def delete_customer(
    customer_id: int,
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    result = await db.execute(select(Customer).where(Customer.id == customer_id))
    customer = result.scalar_one_or_none()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    await db.delete(customer)
    await db.commit()

    return {"success": True, "message": "Customer deleted successfully"}
