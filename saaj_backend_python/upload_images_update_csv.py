"""
upload_images_update_csv.py
===========================
Reads the products CSV, downloads each image from Cloudinary,
uploads it to AWS S3 with proper folder structure, and writes
a new CSV with the S3 URLs replacing the Cloudinary URLs.

After this script completes you can re-import the updated CSV
into the database using import_csv_products.py.

S3 folder structure:
  saajjewels_media/<category-slug>/<uuid>.<ext>

Usage:
  cd saaj_backend_python
  python upload_images_update_csv.py

Prerequisites:
  - .env file with valid AWS credentials (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY,
    AWS_S3_BUCKET_NAME, AWS_S3_REGION)
  - pip install httpx boto3 psycopg2-binary python-dotenv pydantic-settings
"""

import os
import sys
import csv
import json
import uuid
import time
import re

sys.path.insert(0, os.path.dirname(__file__))

import httpx
import boto3
from botocore.exceptions import ClientError
from app.config.settings import get_settings

settings = get_settings()

# ──────────── Paths ────────────
INPUT_CSV = os.path.join(os.path.dirname(__file__), "..", "products_rows (4).csv")
OUTPUT_CSV = os.path.join(os.path.dirname(__file__), "..", "products_rows_s3.csv")

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
    """Test S3 upload access before starting."""
    test_key = "saajjewels_media/_test_upload.txt"
    try:
        s3_client.put_object(
            Bucket=BUCKET, Key=test_key,
            Body=b"test", ContentType="text/plain",
        )
        s3_client.delete_object(Bucket=BUCKET, Key=test_key)
        return True
    except ClientError as e:
        code = e.response["Error"]["Code"]
        msg = e.response["Error"]["Message"]
        print(f"\n  S3 ACCESS FAILED!  {code}: {msg}")
        if code == "AccessDenied":
            print("  Fix: IAM -> Users -> your user -> remove Permissions boundary")
            print("       Ensure AmazonS3FullAccess is attached")
            print(f"       S3 -> {BUCKET} -> Permissions -> uncheck Block Public Access")
        return False


def download_image(http_client: httpx.Client, url: str, max_retries: int = 3):
    """Download with retry + exponential backoff."""
    last_err = None
    for attempt in range(1, max_retries + 1):
        try:
            resp = http_client.get(url)
            resp.raise_for_status()
            return resp.content, resp.headers.get("content-type", "image/jpeg")
        except httpx.HTTPStatusError:
            raise  # Don't retry 404 / 403
        except (
            httpx.ReadTimeout, httpx.ConnectTimeout, httpx.ReadError,
            httpx.ConnectError, httpx.RemoteProtocolError, httpx.PoolTimeout,
            ConnectionError, OSError,
        ) as e:
            last_err = e
            if attempt < max_retries:
                wait = attempt * 2
                print(f"        > Network error (attempt {attempt}/{max_retries}), retrying in {wait}s...")
                time.sleep(wait)
    raise last_err


def ext_from_content_type(ct: str) -> str:
    ct = ct.lower()
    if "png" in ct:
        return "png"
    if "webp" in ct:
        return "webp"
    if "gif" in ct:
        return "gif"
    if "svg" in ct:
        return "svg"
    if "mp4" in ct or "video" in ct:
        return "mp4"
    return "jpg"


# ──────────── Main ────────────
def main():
    print("=" * 70)
    print("  Upload CSV Images to S3 & Generate Updated CSV")
    print("=" * 70)
    print()
    print(f"  Input CSV:   {os.path.abspath(INPUT_CSV)}")
    print(f"  Output CSV:  {os.path.abspath(OUTPUT_CSV)}")
    print(f"  S3 Bucket:   {BUCKET}  ({REGION})")
    print()

    if not os.path.exists(INPUT_CSV):
        print(f"ERROR: Input CSV not found: {INPUT_CSV}")
        sys.exit(1)

    if not settings.AWS_ACCESS_KEY_ID or not settings.AWS_SECRET_ACCESS_KEY:
        print("ERROR: AWS credentials not set in .env")
        sys.exit(1)

    # Pre-check S3 access
    print("  Testing S3 upload access...")
    if not test_s3_access():
        print("\n  Fix the permissions above, then re-run.")
        sys.exit(1)
    print("  S3 access OK!\n")

    # Read CSV rows
    with open(INPUT_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        fieldnames = reader.fieldnames
        rows = list(reader)

    print(f"  Total products in CSV: {len(rows)}\n")

    http_client = httpx.Client(
        timeout=httpx.Timeout(connect=15, read=60, write=30, pool=30),
        follow_redirects=True,
        limits=httpx.Limits(max_connections=10, max_keepalive_connections=5),
    )

    uploaded = 0
    skipped = 0
    failed = 0

    try:
        for idx, row in enumerate(rows):
            product_id = row.get("id", "?")
            product_name = row.get("name", "Unknown")[:50]
            category = row.get("category", "uncategorized")
            media_raw = row.get("media", "")

            if not media_raw or not media_raw.strip():
                print(f"  [{idx+1}/{len(rows)}] #{product_id} {product_name} -- no media, skip")
                skipped += 1
                continue

            try:
                media_list = json.loads(media_raw)
            except json.JSONDecodeError:
                print(f"  [{idx+1}/{len(rows)}] #{product_id} {product_name} -- bad JSON, skip")
                skipped += 1
                continue

            if not media_list:
                skipped += 1
                continue

            folder = sanitize_folder_name(category)
            new_media = []
            changed = False

            print(f"  [{idx+1}/{len(rows)}] #{product_id} {product_name}  ({len(media_list)} images)")

            for i, item in enumerate(media_list):
                old_url = item.get("url", "") if isinstance(item, dict) else str(item)
                media_type = item.get("type", "image") if isinstance(item, dict) else "image"

                if not old_url:
                    new_media.append(item)
                    continue

                # Already on S3?
                if f"{BUCKET}.s3" in old_url:
                    print(f"      [{i+1}] Already S3 OK")
                    new_media.append(item)
                    continue

                # Download
                try:
                    print(f"      [{i+1}] Downloading...")
                    content, ct = download_image(http_client, old_url)
                    ext = ext_from_content_type(ct)
                    if "video" in ct:
                        media_type = "video"
                    size_kb = len(content) / 1024

                    # Upload to S3
                    uid = str(uuid.uuid4())
                    s3_key = f"saajjewels_media/{folder}/{uid}.{ext}"
                    s3_client.put_object(
                        Bucket=BUCKET, Key=s3_key,
                        Body=content, ContentType=ct,
                    )
                    new_url = get_s3_url(s3_key)
                    print(f"      [{i+1}] Uploaded {size_kb:.0f} KB -> {s3_key}")

                    new_media.append({
                        "url": new_url,
                        "type": media_type,
                        "public_id": s3_key,
                        "s3_key": s3_key,
                    })
                    changed = True
                    uploaded += 1

                except httpx.HTTPStatusError as e:
                    print(f"      [{i+1}] HTTP {e.response.status_code} -- kept original URL")
                    new_media.append(item)
                    failed += 1

                except Exception as e:
                    print(f"      [{i+1}] FAIL {type(e).__name__}: {str(e)[:60]} -- kept original")
                    new_media.append(item)
                    failed += 1

                time.sleep(0.3)

            # Update the row's media column with S3 URLs
            if changed:
                row["media"] = json.dumps(new_media)

    finally:
        http_client.close()

    # Write updated CSV
    with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print()
    print("=" * 70)
    print("  Summary")
    print("=" * 70)
    print(f"  Images uploaded to S3:  {uploaded}")
    print(f"  Products skipped:       {skipped}")
    print(f"  Images failed:          {failed}")
    print(f"  Output CSV:             {os.path.abspath(OUTPUT_CSV)}")
    print("=" * 70)

    if failed > 0:
        print("\n  Some images failed. Re-run this script -- it skips already-uploaded ones.")

    print(f"\n  Next steps:")
    print(f"  1. Review the output CSV to make sure URLs are correct")
    print(f"  2. Update DB with the new CSV:")
    print(f"       python import_csv_products.py \"{os.path.abspath(OUTPUT_CSV)}\"")
    print(f"  3. Restart the backend server")
    print(f"  4. Refresh the frontend -- images should load from S3!")


if __name__ == "__main__":
    main()
