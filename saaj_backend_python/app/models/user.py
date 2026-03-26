from sqlalchemy import Column, Integer, String, Boolean, DateTime, JSON
from sqlalchemy.sql import func
from app.config.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, autoincrement=True)
    email = Column(String, nullable=False, unique=True)
    clerk_id = Column(String, unique=True, nullable=True)
    password = Column(String, nullable=True)
    isVerified = Column("isVerified", Boolean, default=False)
    otp = Column(String, nullable=True)
    otpCreatedAt = Column("otpCreatedAt", DateTime, nullable=True)
    googleId = Column("googleId", String, nullable=True)
    firstName = Column("firstName", String, nullable=True)
    lastName = Column("lastName", String, nullable=True)
    profilePicture = Column("profilePicture", String, nullable=True)
    cart = Column(JSON, default=list)
    addresses = Column(JSON, default=list)
    orders = Column(JSON, default=list)
    createdAt = Column("createdAt", DateTime, server_default=func.now())
    updatedAt = Column("updatedAt", DateTime, server_default=func.now(), onupdate=func.now())
