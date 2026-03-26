from fastapi import Request, HTTPException
from app.config.settings import get_settings

settings = get_settings()


async def verify_admin(request: Request):
    """
    Admin authentication middleware.
    Checks the x-admin-token header against the ADMIN_TOKEN env var.
    If ADMIN_TOKEN is not set, allows all requests (development mode).
    """
    if not settings.ADMIN_TOKEN:
        # Dev mode — allow all requests
        return

    token = request.headers.get("x-admin-token")
    if not token or token != settings.ADMIN_TOKEN:
        raise HTTPException(status_code=401, detail="Not authenticated")
