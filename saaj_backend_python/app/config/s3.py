import boto3
from app.config.settings import get_settings

settings = get_settings()

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_S3_REGION,
)


def get_s3_url(key: str) -> str:
    """Generate the public URL for an S3 object."""
    return (
        f"https://{settings.AWS_S3_BUCKET_NAME}"
        f".s3.{settings.AWS_S3_REGION}.amazonaws.com/{key}"
    )
