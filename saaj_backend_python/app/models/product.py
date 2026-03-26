from sqlalchemy import Column, Integer, String, Text, Numeric, JSON, DateTime, Boolean
from sqlalchemy.sql import func
from app.config.database import Base


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    name = Column(String, nullable=False)
    originalPrice = Column("originalPrice", Numeric(10, 2), nullable=False)
    discountedPrice = Column("discountedPrice", Numeric(10, 2), nullable=False)
    media = Column(JSON, nullable=False, default=list)
    quantity = Column(Integer, default=0)
    description = Column(Text, nullable=False)
    category = Column(String, nullable=False)
    rating = Column(Numeric(3, 2), default=4.5)
    reviews = Column(Integer, default=0)
    sku = Column(String, unique=True, nullable=True)
    image = Column(String, nullable=True)
    isActive = Column("isActive", Boolean, default=True, nullable=False, server_default="true")
    createdAt = Column("createdAt", DateTime, server_default=func.now())
    updatedAt = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
