"""
Sitemap Router — /api/sitemap.xml
Generates a dynamic XML sitemap for Google and other search engines.
"""

from fastapi import APIRouter, Depends
from fastapi.responses import Response
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from datetime import datetime

from app.config.database import get_db
from app.models.product import Product

router = APIRouter()

SITE_URL = "https://saajjewels.com"

STATIC_PAGES = [
    {"loc": "/", "priority": "1.0", "changefreq": "daily"},
    {"loc": "/products", "priority": "0.9", "changefreq": "daily"},
    {"loc": "/contact-us", "priority": "0.6", "changefreq": "monthly"},
    {"loc": "/terms-and-conditions", "priority": "0.3", "changefreq": "yearly"},
    {"loc": "/privacy-policy", "priority": "0.3", "changefreq": "yearly"},
    {"loc": "/shipping-policy", "priority": "0.4", "changefreq": "monthly"},
    {"loc": "/return-policy", "priority": "0.4", "changefreq": "monthly"},
]

CATEGORIES = [
    "Necklace", "Bracelet", "Earrings", "Rings", "Pendants",
    "Scrunchies", "Claws", "Hairbows", "Hairclips", "Studs",
    "Jhumka", "Hamper", "Custom Packaging", "Bouquet",
    "Chocolate Tower", "Jhumka Box", "Men's Hamper",
]


@router.get("/sitemap.xml")
async def get_sitemap(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(Product).where(Product.isActive == True)
    )
    products = result.scalars().all()

    today = datetime.utcnow().strftime("%Y-%m-%d")

    urls = []

    for page in STATIC_PAGES:
        urls.append(
            f"  <url>\n"
            f"    <loc>{SITE_URL}{page['loc']}</loc>\n"
            f"    <lastmod>{today}</lastmod>\n"
            f"    <changefreq>{page['changefreq']}</changefreq>\n"
            f"    <priority>{page['priority']}</priority>\n"
            f"  </url>"
        )

    for cat in CATEGORIES:
        urls.append(
            f"  <url>\n"
            f"    <loc>{SITE_URL}/products?category={cat.replace(' ', '%20')}</loc>\n"
            f"    <lastmod>{today}</lastmod>\n"
            f"    <changefreq>weekly</changefreq>\n"
            f"    <priority>0.7</priority>\n"
            f"  </url>"
        )

    for product in products:
        last_mod = today
        if product.updatedAt:
            last_mod = product.updatedAt.strftime("%Y-%m-%d")
        elif product.createdAt:
            last_mod = product.createdAt.strftime("%Y-%m-%d")

        urls.append(
            f"  <url>\n"
            f"    <loc>{SITE_URL}/products/{product.id}</loc>\n"
            f"    <lastmod>{last_mod}</lastmod>\n"
            f"    <changefreq>weekly</changefreq>\n"
            f"    <priority>0.8</priority>\n"
            f"  </url>"
        )

    xml = (
        '<?xml version="1.0" encoding="UTF-8"?>\n'
        '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n"
        "</urlset>"
    )

    return Response(content=xml, media_type="application/xml")
