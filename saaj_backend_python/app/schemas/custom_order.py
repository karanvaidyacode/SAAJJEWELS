from pydantic import BaseModel, EmailStr
from typing import Optional, List, Any


class CustomOrderCreate(BaseModel):
    customerName: str
    customerEmail: EmailStr
    customerPhone: Optional[str] = None
    designDescription: str
    materials: Optional[List[str]] = []
    budgetRange: Optional[str] = None
    referenceImages: Optional[List[str]] = []


class CustomOrderUpdate(BaseModel):
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    designDescription: Optional[str] = None
    materials: Optional[List[str]] = None
    budgetRange: Optional[str] = None
    referenceImages: Optional[List[str]] = None
    status: Optional[str] = None


class CustomOrderStatusUpdate(BaseModel):
    status: str
