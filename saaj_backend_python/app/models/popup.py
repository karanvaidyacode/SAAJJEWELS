from sqlalchemy import Column, Integer, String, Boolean, DateTime, Text, Float
from sqlalchemy.sql import func
from app.config.database import Base


class Popup(Base):
    __tablename__ = "popups"

    id = Column(Integer, primary_key=True, autoincrement=True)
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)

    # Which coupon to award when the user subscribes (FK-like, but loose)
    couponId = Column("couponId", Integer, nullable=True)

    # Display settings
    delaySeconds = Column("delaySeconds", Integer, nullable=False, default=5)
    showOnPages = Column("showOnPages", String(500), nullable=True, default="all")

    isActive = Column("isActive", Boolean, nullable=False, default=True)
    startsAt = Column("startsAt", DateTime, nullable=True)
    endsAt = Column("endsAt", DateTime, nullable=True)

    # Soft delete
    isDeleted = Column("isDeleted", Boolean, nullable=False, default=False)
    deletedAt = Column("deletedAt", DateTime, nullable=True)

    createdAt = Column("createdAt", DateTime, server_default=func.now())
    updatedAt = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
