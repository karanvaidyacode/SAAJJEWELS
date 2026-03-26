"""
migrate_cloudinary_to_s3.py
===========================
One-time script to migrate all product images from Cloudinary to AWS S3.

What it does:
  1. Reads all products from the PostgreSQL database
  2. For each product, downloads every image from its Cloudinary URL
  3. Uploads the image to S3 under saajjewels_media/<category>/<uuid>.<ext>
  4. Updates the product's `media` JSON in the database with the new S3 URLs

Usage:
  cd saaj_backend_python
  python migrate_cloudinary_to_s3.py

Prerequisites:
  - .env file must have valid AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY, AWS_S3_BUCKET_NAME, AWS_S3_REGION)
  - .env file must have valid database credentials (Host, Port, database_name, Username, Password)
  - S3 bucket must exist and have public read access configured
  - IAM user permissions boundary must include S3 actions (or be removed)
  - Products must already be imported into the database (run import_csv_products.py first)
  - pip install httpx boto3 psycopg2-binary python-dotenv pydantic-settings
"""

import os
import sys
import uuid
import json
import time
import re

# Add project root to path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

import httpx
import boto3
from botocore.exceptions import ClientError
from app.config.settings import get_settings

settings = get_settings()

# ──────────── S3 Setup ────────────

s3_client = boto3.client(
    "s3",
    aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
    aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
    region_name=settings.AWS_S3_REGION,
)

BUCKET = settings.AWS_S3_BUCKET_NAME
REGION = settings.AWS_S3_REGION


def get_s3_url(key: str) -> str:
    return f"https://{BUCKET}.s3.{REGION}.amazonaws.com/{key}"


def sanitize_folder_name(name: str) -> str:
    """Convert category name to a safe folder name (lowercase, hyphens)."""
    name = name.strip().lower()
    name = re.sub(r"[^a-z0-9]+", "-", name)
    name = name.strip("-")
    return name or "uncategorized"


def test_s3_access():
    """Test S3 upload access before starting migration."""
    test_key = "saajjewels_media/_migration_test.txt"
    try:
        s3_client.put_object(
            Bucket=BUCKET,
            Key=test_key,
            Body=b"migration test",
            ContentType="text/plain",
        )
        # Clean up test file
        s3_client.delete_object(Bucket=BUCKET, Key=test_key)
        return True
    except ClientError as e:
        error_code = e.response["Error"]["Code"]
        error_msg = e.response["Error"]["Message"]
        print(f"\n  S3 ACCESS TEST FAILED!")
        print(f"  Error: {error_code} - {error_msg}")
        if error_code == "AccessDenied":
            print(f"\n  Your IAM user does not have permission to upload to S3.")
            print(f"  Check these in the AWS Console:")
            print(f"    1. IAM -> Users -> your user -> Permissions boundary")
            print(f"       If set to AmazonRDSFullAccess, click 'Remove boundary'")
            print(f"    2. Ensure AmazonS3FullAccess policy is attached")
            print(f"    3. S3 -> {BUCKET} -> Permissions -> Block public access -> Edit")
            print(f"       Uncheck all 4 boxes and save")
        return False


# ──────────── Database Setup ────────────

def get_db_connection():
    """Create a psycopg2 connection to the PostgreSQL database."""
    import psycopg2

    conn_kwargs = {
        "host": settings.Host,
        "port": settings.Port,
        "dbname": settings.database_name,
        "user": settings.Username,
        "password": settings.Password,
    }

    # Use SSL for AWS RDS
    if "amazonaws" in settings.Host:
        conn_kwargs["sslmode"] = "require"

    conn = psycopg2.connect(**conn_kwargs)
    conn.autocommit = False
    return conn


# ──────────── Download with retries ────────────

def download_image(http_client: httpx.Client, url: str, max_retries: int = 3):
    """
    Download an image with retry logic for network errors.
    Returns (content_bytes, content_type) or raises on permanent failure.
    """
    last_error = None
    for attempt in range(1, max_retries + 1):
        try:
            response = http_client.get(url)
            response.raise_for_status()
            return response.content, response.headers.get("content-type", "image/jpeg")
        except httpx.HTTPStatusError:
            raise  # Don't retry 404s, 403s etc.
        except (
            httpx.ReadTimeout,
            httpx.ConnectTimeout,
            httpx.ReadError,
            httpx.ConnectError,
            httpx.RemoteProtocolError,
            httpx.PoolTimeout,
            ConnectionError,
            OSError,
        ) as e:
            last_error = e
            if attempt < max_retries:
                wait = attempt * 2  # 2s, 4s backoff
                print(f"           Network error (attempt {attempt}/{max_retries}), retrying in {wait}s...")
                time.sleep(wait)
            else:
                raise last_error


# ──────────── Migration Logic ────────────

def migrate():
    print("=" * 70)
    print("  Cloudinary -> S3 Image Migration Script")
    print("=" * 70)
    print()
    print(f"  Database: {settings.Host}:{settings.Port}/{settings.database_name}")
    print(f"  S3 Bucket: {BUCKET} ({REGION})")
    print()

    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        print("ERROR: AWS credentials not set in .env")
        sys.exit(1)

    # Test S3 access before starting
    print("  Testing S3 upload access...")
    if not test_s3_access():
        print("\n  Fix the S3 permissions above, then re-run this script.")
        sys.exit(1)
    print("  S3 access OK!\n")

    conn = get_db_connection()
    cursor = conn.cursor()

    # Fetch all products
    cursor.execute('SELECT id, name, category, media FROM products ORDER BY id')
    rows = cursor.fetchall()
    print(f"Found {len(rows)} products to process\n")

    if len(rows) == 0:
        print("No products found in the database!")
        print("Run 'python import_csv_products.py' first to import product data.")
        cursor.close()
        conn.close()
        return

    total_uploaded = 0
    total_skipped = 0
    total_failed = 0

    # Create a single HTTP client for all downloads (connection pooling)
    http_client = httpx.Client(
        timeout=httpx.Timeout(connect=15, read=60, write=30, pool=30),
        follow_redirects=True,
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
    )

    try:
        for row in rows:
            product_id, product_name, category, media_json = row

            if not media_json:
                print(f"  [SKIP] Product #{product_id} ({product_name}) -- no media")
                total_skipped += 1
                continue

            # Parse media JSON
            if isinstance(media_json, str):
                try:
                    media_list = json.loads(media_json)
                except json.JSONDecodeError:
                    print(f"  [SKIP] Product #{product_id} ({product_name}) -- invalid JSON")
                    total_skipped += 1
                    continue
            elif isinstance(media_json, list):
                media_list = media_json
            else:
                print(f"  [SKIP] Product #{product_id} ({product_name}) -- unexpected media type: {type(media_json)}")
                total_skipped += 1
                continue

            if not media_list:
                print(f"  [SKIP] Product #{product_id} ({product_name}) -- empty media list")
                total_skipped += 1
                continue

            # Determine folder structure: saajjewels_media/<category>/
            folder = sanitize_folder_name(category or "uncategorized")
            new_media = []
            has_changes = False

            print(f"\nProduct #{product_id}: {product_name} ({category}) -- {len(media_list)} media items")

            for i, item in enumerate(media_list):
                old_url = item.get("url", "") if isinstance(item, dict) else str(item)
                media_type = item.get("type", "image") if isinstance(item, dict) else "image"

                if not old_url:
                    print(f"     [{i+1}] No URL, skipping")
                    new_media.append(item)
                    continue

                # Check if already an S3 URL for our bucket
                if f"{BUCKET}.s3" in old_url:
                    print(f"     [{i+1}] Already on S3, skipping")
                    new_media.append(item)
                    continue

                # Download from Cloudinary (or any URL)
                try:
                    print(f"     [{i+1}] Downloading: {old_url[:80]}...")

                    content, content_type = download_image(http_client, old_url)
                    file_size_kb = len(content) / 1024

                    # Determine extension from content type
                    ext = "jpg"
                    if "png" in content_type:
                        ext = "png"
                    elif "webp" in content_type:
                        ext = "webp"
                    elif "gif" in content_type:
                        ext = "gif"
                    elif "svg" in content_type:
                        ext = "svg"
                    elif "video/mp4" in content_type:
                        ext = "mp4"
                        media_type = "video"
                    elif "video" in content_type:
                        ext = "mp4"
                        media_type = "video"

                    # Generate S3 key with proper folder structure
                    unique_id = str(uuid.uuid4())
                    s3_key = f"saajjewels_media/{folder}/{unique_id}.{ext}"

                    # Upload to S3
                    s3_client.put_object(
                        Bucket=BUCKET,
                        Key=s3_key,
                        Body=content,
                        ContentType=content_type,
                    )

                    new_url = get_s3_url(s3_key)
                    print(f"     [{i+1}] Uploaded ({file_size_kb:.1f} KB) -> {s3_key}")

                    new_media.append({
                        "url": new_url,
                        "type": media_type,
                        "public_id": s3_key,
                        "s3_key": s3_key,
                    })
                    has_changes = True
                    total_uploaded += 1

                except httpx.HTTPStatusError as e:
                    print(f"     [{i+1}] HTTP Error {e.response.status_code}: {old_url[:60]}")
                    new_media.append(item)  # Keep old entry
                    total_failed += 1

                except (
                    httpx.ReadTimeout,
                    httpx.ConnectTimeout,
                    httpx.ReadError,
                    httpx.ConnectError,
                    httpx.RemoteProtocolError,
                    httpx.PoolTimeout,
                    ConnectionError,
                    OSError,
                ) as e:
                    print(f"     [{i+1}] Network error after retries: {type(e).__name__}: {str(e)[:60]}")
                    new_media.append(item)  # Keep old entry
                    total_failed += 1

                except ClientError as e:
                    error_code = e.response["Error"]["Code"]
                    print(f"     [{i+1}] S3 Error ({error_code}): {str(e)[:60]}")
                    new_media.append(item)  # Keep old entry
                    total_failed += 1

                except Exception as e:
                    print(f"     [{i+1}] Failed: {type(e).__name__}: {str(e)[:80]}")
                    new_media.append(item)  # Keep old entry
                    total_failed += 1

                # Small delay to be nice to Cloudinary
                time.sleep(0.3)

            # Update the product in DB if anything changed
            if has_changes:
                try:
                    cursor.execute(
                        'UPDATE products SET media = %s WHERE id = %s',
                        (json.dumps(new_media), product_id)
                    )
                    conn.commit()
                    print(f"  Database updated for product #{product_id}")
                except Exception as e:
                    conn.rollback()
                    print(f"  DB update failed for product #{product_id}: {e}")
            else:
                print(f"  No changes needed for product #{product_id}")

    finally:
        http_client.close()

    cursor.close()
    conn.close()

    print("\n" + "=" * 70)
    print("  Migration Summary")
    print("=" * 70)
    print(f"  Uploaded to S3:  {total_uploaded}")
    print(f"  Skipped:         {total_skipped}")
    print(f"  Failed:          {total_failed}")
    print(f"  Total products:  {len(rows)}")
    print("=" * 70)

    if total_failed > 0:
        print("\n  Some images failed to migrate. You can re-run this script")
        print("  safely -- it will skip images that are already on S3.")
    else:
        print("\n  All images migrated successfully!")

    print(f"\n  Next steps:")
    print(f"  1. Verify images at: https://{BUCKET}.s3.{REGION}.amazonaws.com/saajjewels_media/")
    print(f"  2. Make sure S3 bucket has public read access (bucket policy)")
    print(f"  3. Restart the backend server")
    print(f"  4. Refresh the frontend -- images should now load from S3")


if __name__ == "__main__":
    migrate()
