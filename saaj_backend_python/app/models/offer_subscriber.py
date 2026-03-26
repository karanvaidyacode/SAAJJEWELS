from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from app.config.database import Base


class OfferSubscriber(Base):
    __tablename__ = "offer_subscribers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, nullable=False, unique=True)
    couponClaimed = Column("couponClaimed", Boolean, default=True)
    couponCode = Column("couponCode", String, default="SAAJ10")
    createdAt = Column("createdAt", DateTime, server_default=func.now())
    updatedAt = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
