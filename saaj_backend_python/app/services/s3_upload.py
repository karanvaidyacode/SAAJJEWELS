import uuid
from fastapi import UploadFile
from app.config.s3 import s3_client, get_s3_url
from app.config.settings import get_settings
import logging

logger = logging.getLogger(__name__)
settings = get_settings()


async def upload_file_to_s3(file: UploadFile) -> dict:
    """
    Upload a single file to AWS S3.
    Returns a dict with url, type, and s3_key.
    """
    try:
        # Determine file type
        content_type = file.content_type or "application/octet-stream"
        is_video = content_type.startswith("video/")

        # Generate unique key
        ext = file.filename.rsplit(".", 1)[-1] if "." in file.filename else "jpg"
        unique_id = str(uuid.uuid4())
        s3_key = f"saajjewels_media/{unique_id}.{ext}"

        # Read file content
        content = await file.read()

        # Upload to S3
        s3_client.put_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=s3_key,
            Body=content,
            ContentType=content_type,
        )

        url = get_s3_url(s3_key)

        logger.info(f"File uploaded to S3: {s3_key}")

        return {
            "url": url,
            "type": "video" if is_video else "image",
            "public_id": s3_key,
            "s3_key": s3_key,
        }

    except Exception as e:
        logger.error(f"S3 upload failed: {str(e)}")
        raise


async def upload_files_to_s3(files: list[UploadFile]) -> list[dict]:
    """Upload multiple files to S3."""
    results = []
    for file in files:
        result = await upload_file_to_s3(file)
        results.append(result)
    return results


def delete_file_from_s3(s3_key: str):
    """Delete a file from S3."""
    try:
        s3_client.delete_object(
            Bucket=settings.AWS_S3_BUCKET_NAME,
            Key=s3_key,
        )
        logger.info(f"File deleted from S3: {s3_key}")
    except Exception as e:
        logger.error(f"S3 delete failed: {str(e)}")
