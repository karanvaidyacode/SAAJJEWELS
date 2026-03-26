from pydantic import BaseModel
from typing import Optional


class AuthUserResponse(BaseModel):
    id: str
    email: str
    name: Optional[str] = None
    profilePicture: Optional[str] = None
