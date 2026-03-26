from pydantic import BaseModel
from typing import Optional, List, Any
from decimal import Decimal


class OrderCreate(BaseModel):
    orderNumber: Optional[str] = None
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    shippingAddress: Optional[str] = None
    items: Optional[List[Any]] = None
    totalAmount: Decimal
    status: Optional[str] = "pending"
    paymentMethod: Optional[str] = None
    paymentStatus: Optional[str] = "pending"
    razorpayOrderId: Optional[str] = None
    razorpayPaymentId: Optional[str] = None
    couponCode: Optional[str] = None
    customer: Optional[Any] = None  # Accept but ignore


class OrderUpdate(BaseModel):
    customerName: Optional[str] = None
    customerEmail: Optional[str] = None
    customerPhone: Optional[str] = None
    shippingAddress: Optional[str] = None
    items: Optional[List[Any]] = None
    totalAmount: Optional[Decimal] = None
    status: Optional[str] = None
    paymentStatus: Optional[str] = None
    paymentMethod: Optional[str] = None
    razorpayOrderId: Optional[str] = None
    razorpayPaymentId: Optional[str] = None


class OrderStatusUpdate(BaseModel):
    status: str
