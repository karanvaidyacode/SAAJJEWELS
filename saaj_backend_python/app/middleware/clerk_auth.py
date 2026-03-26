import time as _time

from fastapi import Request, HTTPException
from jose import jwt
from jose.exceptions import JWKError, ExpiredSignatureError
import httpx
from app.config.settings import get_settings

settings = get_settings()

_jwks_cache = None
_jwks_fetched_at: float = 0
_JWKS_TTL_SECONDS = 3600


async def _get_jwks(force_refresh: bool = False):
    """Fetch and cache Clerk JWKS keys, refreshing every hour."""
    global _jwks_cache, _jwks_fetched_at
    now = _time.time()
    if _jwks_cache is None or force_refresh or (now - _jwks_fetched_at > _JWKS_TTL_SECONDS):
        if not settings.CLERK_JWKS_URL:
            raise HTTPException(
                status_code=500,
                detail="CLERK_JWKS_URL not configured"
            )
        async with httpx.AsyncClient() as client:
            resp = await client.get(settings.CLERK_JWKS_URL)
            resp.raise_for_status()
            _jwks_cache = resp.json()
            _jwks_fetched_at = now
    return _jwks_cache


async def verify_clerk_token(request: Request) -> dict:
    """
    Verify the Clerk JWT from the Authorization header.
    Returns the decoded token payload with user claims.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Not authenticated")

    token = auth_header.split(" ")[1]

    try:
        jwks = await _get_jwks()

        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")

        rsa_key = None
        for key in jwks.get("keys", []):
            if key["kid"] == kid:
                rsa_key = key
                break

        if not rsa_key:
            jwks = await _get_jwks(force_refresh=True)
            for key in jwks.get("keys", []):
                if key["kid"] == kid:
                    rsa_key = key
                    break

        if not rsa_key:
            raise HTTPException(status_code=401, detail="Invalid token key")

        # Decode and verify the token
        payload = jwt.decode(
            token,
            rsa_key,
            algorithms=["RS256"],
            options={"verify_aud": False}
        )
        return payload

    except ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    except JWKError:
        raise HTTPException(status_code=401, detail="Invalid token")
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


def get_clerk_user_email(claims: dict) -> str:
    """Extract email from Clerk JWT claims."""
    # Clerk stores email in different possible locations
    email = claims.get("email")
    if not email:
        # Try email_addresses array
        email_addresses = claims.get("email_addresses", [])
        if email_addresses:
            email = email_addresses[0].get("email_address")
    if not email:
        # Try sub as fallback
        email = claims.get("sub", "")
    return email


def get_clerk_user_id(claims: dict) -> str:
    """Extract user ID from Clerk JWT claims."""
    return claims.get("sub", "")
