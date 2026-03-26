import enum
from sqlalchemy import Column, Integer, String, Text, JSON, DateTime
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.sql import func
from app.config.database import Base


class CustomOrderStatusEnum(str, enum.Enum):
    pending = "pending"
    consulting = "consulting"
    designing = "designing"
    production = "production"
    shipped = "shipped"
    delivered = "delivered"
    cancelled = "cancelled"


custom_order_status_enum = ENUM(
    "pending", "consulting", "designing", "production",
    "shipped", "delivered", "cancelled",
    name="enum_custom_orders_status", create_type=False
)


class CustomOrder(Base):
    __tablename__ = "custom_orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    customerName = Column("customerName", String, nullable=False)
    customerEmail = Column("customerEmail", String, nullable=False)
    customerPhone = Column("customerPhone", String, nullable=True)
    designDescription = Column("designDescription", Text, nullable=False)
    materials = Column(JSON, default=list)
    budgetRange = Column("budgetRange", String, nullable=True)
    status = Column(custom_order_status_enum, default="pending")
    referenceImages = Column("referenceImages", JSON, default=list)
    createdAt = Column("createdAt", DateTime, server_default=func.now())
    updatedAt = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
