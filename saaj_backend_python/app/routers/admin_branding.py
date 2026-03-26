"""
Admin Branding Router — /api/admin/branding/*
Manages branding settings and shipping config (in-memory).
"""

from fastapi import APIRouter, Depends, Request
from app.middleware.admin_auth import verify_admin

router = APIRouter()

# In-memory branding settings
_branding_settings = {
    "siteName": "Saaj Jewels",
    "logoUrl": "/logo.jpg",
    "primaryColor": "#c6a856",
    "secondaryColor": "#f5f5f5",
    "fontFamily": "Arial, sans-serif",
    "faviconUrl": "/favicon.ico",
    "contactEmail": "saajewels45@gmail.com",
    "contactPhone": "+91-9921810182",
    "socialLinks": {
        "instagram": "https://www.instagram.com/saaj__jewels",
    },
}

_default_settings = dict(_branding_settings)

# In-memory shipping settings
_shipping_settings = {
    "enabled": True,
    "cost": 69,
}


@router.get("/")
async def get_branding_settings(request: Request):
    await verify_admin(request)
    return _branding_settings


@router.put("/")
async def update_branding_settings(request: Request):
    await verify_admin(request)
    global _branding_settings

    body = await request.json()
    _branding_settings.update(body)

    return {
        "success": True,
        "message": "Branding settings updated successfully",
        "settings": _branding_settings,
    }


@router.post("/reset")
async def reset_branding_settings(request: Request):
    await verify_admin(request)
    global _branding_settings

    _branding_settings = {
        "siteName": "Saaj Jewels",
        "logoUrl": "/logo.png",
        "primaryColor": "#c6a856",
        "secondaryColor": "#f5f5f5",
        "fontFamily": "Arial, sans-serif",
        "faviconUrl": "/favicon.ico",
        "contactEmail": "saajewels45@gmail.com",
        "contactPhone": "+91-9921810182",
        "socialLinks": {
            "instagram": "https://www.instagram.com/saaj__jewels",
        },
    }

    return {
        "success": True,
        "message": "Branding settings reset to defaults",
        "settings": _branding_settings,
    }


@router.post("/search-similar")
async def search_similar_branding(request: Request):
    await verify_admin(request)
    return []


# ── Shipping settings (admin) ──

@router.get("/shipping")
async def get_shipping_settings(request: Request):
    await verify_admin(request)
    return _shipping_settings


@router.put("/shipping")
async def update_shipping_settings(request: Request):
    await verify_admin(request)
    global _shipping_settings
    body = await request.json()
    if "enabled" in body:
        _shipping_settings["enabled"] = bool(body["enabled"])
    if "cost" in body:
        _shipping_settings["cost"] = float(body["cost"])
    return {"success": True, "shipping": _shipping_settings}


# ── Public shipping endpoint (no auth) ──

@router.get("/shipping/public")
async def get_shipping_public():
    """Public endpoint so the storefront can read shipping config without admin auth."""
    return _shipping_settings
