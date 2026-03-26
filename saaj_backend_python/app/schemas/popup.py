from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class PopupCreate(BaseModel):
    title: str
    description: Optional[str] = None
    couponId: Optional[int] = None
    delaySeconds: int = 5
    showOnPages: Optional[str] = "all"
    isActive: bool = True
    startsAt: Optional[datetime] = None
    endsAt: Optional[datetime] = None


class PopupUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    couponId: Optional[int] = None
    delaySeconds: Optional[int] = None
    showOnPages: Optional[str] = None
    isActive: Optional[bool] = None
    startsAt: Optional[datetime] = None
    endsAt: Optional[datetime] = None


class PopupOut(BaseModel):
    id: int
    title: str
    description: Optional[str] = None
    couponId: Optional[int] = None
    couponCode: Optional[str] = None
    couponDiscountType: Optional[str] = None
    couponDiscountValue: Optional[float] = None
    delaySeconds: int
    showOnPages: Optional[str] = None
    isActive: bool
    startsAt: Optional[datetime] = None
    endsAt: Optional[datetime] = None
    isDeleted: bool = False
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True
