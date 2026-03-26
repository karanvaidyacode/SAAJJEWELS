"""
Admin Analytics Router — /api/admin/analytics/*
Dashboard stats, sales data, order stats, customer analytics, product performance.
"""

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func, or_
from datetime import datetime, timedelta
import json

from app.config.database import get_db
from app.models.order import Order
from app.models.product import Product
from app.models.customer import Customer
from app.middleware.admin_auth import verify_admin
from app.utils.helpers import to_serializable

router = APIRouter()


@router.get("/dashboard")
async def get_dashboard_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    total_orders_r = await db.execute(select(func.count(Order.id)))
    total_orders = total_orders_r.scalar() or 0

    revenue_r = await db.execute(
        select(func.sum(Order.totalAmount)).where(Order.paymentStatus == "paid")
    )
    total_revenue = float(revenue_r.scalar() or 0)

    customers_r = await db.execute(select(func.count(Customer.id)))
    total_customers = customers_r.scalar() or 0

    products_r = await db.execute(select(func.count(Product.id)))
    total_products = products_r.scalar() or 0

    # Orders by status
    status_r = await db.execute(
        select(Order.status, func.count(Order.id)).group_by(Order.status)
    )
    orders_by_status = [
        {"status": row[0], "count": int(row[1])} for row in status_r.all()
    ]

    return {
        "totalOrders": total_orders,
        "totalRevenue": total_revenue,
        "totalCustomers": total_customers,
        "totalProducts": total_products,
        "ordersByStatus": orders_by_status,
    }


@router.get("/sales")
async def get_sales_data(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    six_months_ago = datetime.utcnow() - timedelta(days=180)

    result = await db.execute(
        select(
            func.to_char(Order.createdAt, "Mon").label("month"),
            func.sum(Order.totalAmount).label("revenue"),
        )
        .where(Order.paymentStatus == "paid", Order.createdAt >= six_months_ago)
        .group_by(
            func.to_char(Order.createdAt, "Mon"),
            func.date_part("month", Order.createdAt),
        )
        .order_by(func.date_part("month", Order.createdAt).asc())
    )

    return [
        {"month": row.month, "revenue": float(row.revenue or 0)}
        for row in result.all()
    ]


@router.get("/orders")
async def get_order_stats(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    total_r = await db.execute(select(func.count(Order.id)))
    total_orders = total_r.scalar() or 0

    pending_r = await db.execute(
        select(func.count(Order.id)).where(Order.status == "pending")
    )
    pending_orders = pending_r.scalar() or 0

    delivered_r = await db.execute(
        select(func.count(Order.id)).where(Order.status == "delivered")
    )
    completed_orders = delivered_r.scalar() or 0

    cancelled_r = await db.execute(
        select(func.count(Order.id)).where(Order.status == "cancelled")
    )
    cancelled_orders = cancelled_r.scalar() or 0

    # Order trend (last 7 days)
    trend_r = await db.execute(
        select(
            func.date(Order.createdAt).label("date"),
            func.count(Order.id).label("count"),
        )
        .group_by(func.date(Order.createdAt))
        .order_by(func.date(Order.createdAt).desc())
        .limit(7)
    )
    order_trend = [
        {"date": str(row.date), "count": int(row.count)}
        for row in reversed(trend_r.all())
    ]

    return {
        "totalOrders": total_orders,
        "pendingOrders": pending_orders,
        "completedOrders": completed_orders,
        "cancelledOrders": cancelled_orders,
        "orderTrend": order_trend,
    }


@router.get("/customers")
async def get_customer_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    total_r = await db.execute(select(func.count(Customer.id)))
    total_customers = total_r.scalar() or 0

    active_r = await db.execute(
        select(func.count(Customer.id)).where(Customer.status == "active")
    )
    active_customers = active_r.scalar() or 0

    return {
        "totalCustomers": total_customers,
        "activeCustomers": active_customers,
        "newCustomers": 0,
        "returningCustomers": 0,
        "customerGrowth": [],
    }


@router.get("/products")
async def get_product_performance(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)

    # Top products from paid orders
    orders_r = await db.execute(
        select(Order).where(Order.paymentStatus == "paid")
    )
    orders = orders_r.scalars().all()

    product_sales = {}
    for order in orders:
        items = order.items or []
        if isinstance(items, str):
            try:
                items = json.loads(items)
            except (json.JSONDecodeError, TypeError):
                items = []
        if isinstance(items, list):
            for item in items:
                name = item.get("name") or item.get("productName") or "Unknown"
                product_sales[name] = product_sales.get(name, 0) + (item.get("quantity") or 1)

    top_products = sorted(
        [{"name": k, "sales": v} for k, v in product_sales.items()],
        key=lambda x: x["sales"],
        reverse=True,
    )[:5]

    # Category performance
    cat_r = await db.execute(
        select(Product.category, func.count(Product.id).label("count"))
        .group_by(Product.category)
    )
    category_perf = [
        {"category": row.category, "count": int(row.count)}
        for row in cat_r.all()
    ]

    return {
        "topSellingProducts": top_products,
        "categoryPerformance": category_perf,
    }


@router.post("/search")
async def search_analytics(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    await verify_admin(request)
    body = await request.json()
    query = body.get("query", "")

    result = await db.execute(
        select(Order)
        .where(
            or_(
                Order.orderNumber.ilike(f"%{query}%"),
                Order.customerName.ilike(f"%{query}%"),
            )
        )
        .limit(10)
    )
    orders = result.scalars().all()
    return [to_serializable(o) for o in orders]


@router.post("/update")
async def update_analytics(request: Request):
    await verify_admin(request)
    return {"success": True, "message": "Stats are now real-time from database"}
