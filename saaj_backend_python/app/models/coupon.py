from sqlalchemy import Column, Integer, String, Float, Boolean, DateTime, Text
from sqlalchemy.sql import func
from app.config.database import Base


class Coupon(Base):
    __tablename__ = "coupons"

    id = Column(Integer, primary_key=True, autoincrement=True)
    code = Column(String(50), nullable=False, unique=True, index=True)
    description = Column(Text, nullable=True)

    # "percentage" or "fixed"
    discountType = Column("discountType", String(20), nullable=False, default="percentage")
    discountValue = Column("discountValue", Float, nullable=False)

    # Cap the discount (useful for percentage coupons, e.g. "20% off, max ₹500")
    maxDiscount = Column("maxDiscount", Float, nullable=True)
    # Minimum order value required to apply this coupon
    minOrderValue = Column("minOrderValue", Float, nullable=True, default=0)

    # Usage limits
    maxUses = Column("maxUses", Integer, nullable=True)
    perUserLimit = Column("perUserLimit", Integer, nullable=True, default=1)
    usedCount = Column("usedCount", Integer, nullable=False, default=0)

    isActive = Column("isActive", Boolean, nullable=False, default=True)
    expiresAt = Column("expiresAt", DateTime, nullable=True)

    # Soft delete
    isDeleted = Column("isDeleted", Boolean, nullable=False, default=False)
    deletedAt = Column("deletedAt", DateTime, nullable=True)

    createdAt = Column("createdAt", DateTime, server_default=func.now())
    updatedAt = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
