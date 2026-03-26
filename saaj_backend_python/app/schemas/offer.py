from pydantic import BaseModel, EmailStr
from typing import Optional


class OfferSubscribeRequest(BaseModel):
    email: EmailStr


class OfferClaimRequest(BaseModel):
    email: Optional[str] = None
