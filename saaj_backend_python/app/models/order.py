import enum
import random
from sqlalchemy import Column, Integer, String, Text, Numeric, JSON, DateTime, event
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.sql import func
from app.config.database import Base


class OrderStatusEnum(str, enum.Enum):
    pending = "pending"
    processing = "processing"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


class PaymentStatusEnum(str, enum.Enum):
    pending = "pending"
    paid = "paid"
    failed = "failed"
    refunded = "refunded"


class PaymentMethodEnum(str, enum.Enum):
    cod = "cod"
    razorpay = "razorpay"
    paypal = "paypal"
    coupon = "coupon"


order_status_enum = ENUM(
    "pending", "processing", "shipped", "delivered", "cancelled",
    name="enum_orders_status", create_type=False
)

payment_status_enum = ENUM(
    "pending", "paid", "failed", "refunded",
    name="enum_orders_paymentStatus", create_type=False
)

payment_method_enum = ENUM(
    "cod", "razorpay", "paypal", "coupon",
    name="enum_orders_paymentMethod", create_type=False
)


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    orderNumber = Column("orderNumber", String, unique=True, nullable=False)
    customerId = Column("customerId", Integer, nullable=True)
    customerName = Column("customerName", String, nullable=True)
    customerEmail = Column("customerEmail", String, nullable=True)
    customerPhone = Column("customerPhone", String, nullable=True)
    shippingAddress = Column("shippingAddress", Text, nullable=True)
    items = Column(JSON, nullable=True)
    totalAmount = Column("totalAmount", Numeric(12, 2), nullable=False)
    status = Column(order_status_enum, default="pending")
    paymentStatus = Column("paymentStatus", payment_status_enum, default="pending")
    paymentMethod = Column("paymentMethod", payment_method_enum, nullable=True)
    razorpayOrderId = Column("razorpayOrderId", String, nullable=True)
    razorpayPaymentId = Column("razorpayPaymentId", String, nullable=True)
    couponCode = Column("couponCode", String, nullable=True)
    originalSubtotal = Column("originalSubtotal", Numeric(12, 2), nullable=True)
    discountAmount = Column("discountAmount", Numeric(12, 2), nullable=True, default=0)
    shippingCost = Column("shippingCost", Numeric(12, 2), nullable=True, default=0)
    createdAt = Column("createdAt", DateTime, server_default=func.now())
    updatedAt = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())


def generate_order_number(mapper, connection, target):
    """Generate order number before insert if not set."""
    if not target.orderNumber:
        import time
        timestamp = str(int(time.time() * 1000))[-6:]
        rand = random.randint(1000, 9999)
        target.orderNumber = f"SJ-{timestamp}-{rand}"


event.listen(Order, "before_insert", generate_order_number)
