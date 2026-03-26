from pydantic import BaseModel, EmailStr
from typing import Optional
from decimal import Decimal


class CustomerCreate(BaseModel):
    name: str
    email: EmailStr
    phone: Optional[str] = None
    address: Optional[str] = None
    totalOrders: Optional[int] = 0
    totalSpent: Optional[Decimal] = Decimal("0")
    status: Optional[str] = "active"


class CustomerUpdate(BaseModel):
    name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    address: Optional[str] = None
    totalOrders: Optional[int] = None
    totalSpent: Optional[Decimal] = None
    status: Optional[str] = None
