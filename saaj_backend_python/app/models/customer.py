import enum
from sqlalchemy import Column, Integer, String, Text, Numeric, DateTime
from sqlalchemy.dialects.postgresql import ENUM
from sqlalchemy.sql import func
from app.config.database import Base


class CustomerStatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"
    blocked = "blocked"


customer_status_enum = ENUM(
    "active", "inactive", "blocked",
    name="enum_customers_status", create_type=False
)


class Customer(Base):
    __tablename__ = "customers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    email = Column(String, nullable=False, unique=True)
    phone = Column(String, nullable=True)
    address = Column(Text, nullable=True)
    totalOrders = Column("totalOrders", Integer, default=0)
    totalSpent = Column("totalSpent", Numeric(12, 2), default=0)
    lastOrderDate = Column("lastOrderDate", DateTime, nullable=True)
    status = Column(customer_status_enum, default="active")
    createdAt = Column("createdAt", DateTime, server_default=func.now())
    updatedAt = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
