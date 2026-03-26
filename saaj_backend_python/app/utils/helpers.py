import time
import random
from decimal import Decimal
from datetime import datetime
from typing import Any


def generate_order_number() -> str:
    """Generate a unique order number in the format SJ-XXXXXX-XXXX."""
    timestamp = str(int(time.time() * 1000))[-6:]
    rand = random.randint(1000, 9999)
    return f"SJ-{timestamp}-{rand}"


def to_serializable(obj: Any) -> Any:
    """Convert SQLAlchemy model instance to a JSON-serializable dict."""
    if obj is None:
        return None
    if isinstance(obj, list):
        return [to_serializable(item) for item in obj]

    result = {}
    for column in obj.__table__.columns:
        value = getattr(obj, column.key, None)
        if isinstance(value, Decimal):
            value = float(value)
        elif isinstance(value, datetime):
            value = value.isoformat()
        result[column.name] = value
    return result
