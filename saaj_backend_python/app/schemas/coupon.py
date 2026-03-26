from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class CouponCreate(BaseModel):
    code: str
    description: Optional[str] = None
    discountType: str = "percentage"
    discountValue: float
    maxDiscount: Optional[float] = None
    minOrderValue: Optional[float] = 0
    maxUses: Optional[int] = None
    perUserLimit: Optional[int] = 1
    isActive: bool = True
    expiresAt: Optional[datetime] = None

    @field_validator("code")
    @classmethod
    def uppercase_code(cls, v: str) -> str:
        return v.strip().upper()

    @field_validator("discountType")
    @classmethod
    def validate_type(cls, v: str) -> str:
        if v not in ("percentage", "fixed"):
            raise ValueError("discountType must be 'percentage' or 'fixed'")
        return v


class CouponUpdate(BaseModel):
    description: Optional[str] = None
    discountType: Optional[str] = None
    discountValue: Optional[float] = None
    maxDiscount: Optional[float] = None
    minOrderValue: Optional[float] = None
    maxUses: Optional[int] = None
    perUserLimit: Optional[int] = None
    isActive: Optional[bool] = None
    expiresAt: Optional[datetime] = None


class CouponOut(BaseModel):
    id: int
    code: str
    description: Optional[str] = None
    discountType: str
    discountValue: float
    maxDiscount: Optional[float] = None
    minOrderValue: Optional[float] = 0
    maxUses: Optional[int] = None
    perUserLimit: Optional[int] = 1
    usedCount: int = 0
    isActive: bool
    expiresAt: Optional[datetime] = None
    isDeleted: bool = False
    createdAt: Optional[datetime] = None
    updatedAt: Optional[datetime] = None

    class Config:
        from_attributes = True


class CouponValidateRequest(BaseModel):
    code: str
    orderTotal: float = 0
    email: Optional[str] = None
