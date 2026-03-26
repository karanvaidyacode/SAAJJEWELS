from pydantic import BaseModel
from typing import Optional, List, Any
from decimal import Decimal


class MediaItem(BaseModel):
    url: str
    type: str  # "image" or "video"
    public_id: Optional[str] = None
    s3_key: Optional[str] = None


class ProductCreate(BaseModel):
    name: str
    originalPrice: Decimal
    discountedPrice: Decimal
    description: str
    category: str
    quantity: int = 0
    rating: Optional[Decimal] = Decimal("4.5")
    sku: Optional[str] = None


class ProductUpdate(BaseModel):
    name: Optional[str] = None
    originalPrice: Optional[Decimal] = None
    discountedPrice: Optional[Decimal] = None
    description: Optional[str] = None
    category: Optional[str] = None
    quantity: Optional[int] = None
    rating: Optional[Decimal] = None
    sku: Optional[str] = None
    media: Optional[List[Any]] = None
