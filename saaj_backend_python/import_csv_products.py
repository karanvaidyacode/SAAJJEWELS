"""
import_csv_products.py
======================
Import / update products from a CSV export into the PostgreSQL database.

Usage:
  cd saaj_backend_python
  python import_csv_products.py                          # insert new only (default)
  python import_csv_products.py --update                 # update existing products too
  python import_csv_products.py path/to/file.csv         # custom CSV path
  python import_csv_products.py path/to/file.csv --update

The script:
  1. Reads the CSV file
  2. Inserts each row into the `products` table (new products)
  3. Optionally UPDATES existing products with data from the CSV (--update flag)
  4. Preserves original IDs, media JSON, timestamps, etc.
  5. Sets isActive=true for all imported products
"""

import os
import sys
import csv
import json
from datetime import datetime

# Add project root to path so we can import app modules
sys.path.insert(0, os.path.dirname(__file__))

import psycopg2
from app.config.settings import get_settings

settings = get_settings()


def get_db_connection():
    conn_kwargs = {
        "host": settings.Host,
        "port": settings.Port,
        "dbname": settings.database_name,
        "user": settings.Username,
        "password": settings.Password,
    }
    if "amazonaws" in settings.Host:
        conn_kwargs["sslmode"] = "require"

    conn = psycopg2.connect(**conn_kwargs)
    conn.autocommit = False
    return conn


def parse_csv_value(value, field_type="str"):
    """Parse a CSV value into the appropriate Python type."""
    if value is None or value.strip() == "":
        return None

    if field_type == "int":
        try:
            return int(value)
        except (ValueError, TypeError):
            return 0
    elif field_type == "float":
        try:
            return float(value)
        except (ValueError, TypeError):
            return 0.0
    elif field_type == "json":
        try:
            return json.loads(value) if value.strip() else None
        except json.JSONDecodeError:
            return None
    elif field_type == "datetime":
        try:
            # Handle PostgreSQL timestamp format
            return value.strip() if value.strip() else None
        except Exception:
            return None
    else:
        return value.strip() if value else None


def import_csv(csv_path: str, update_existing: bool = False):
    print("=" * 70)
    print("  CSV Product Import Script")
    print("=" * 70)
    print()
    print(f"  CSV File:  {csv_path}")
    print(f"  Database:  {settings.Host}:{settings.Port}/{settings.database_name}")
    print(f"  Mode:      {'INSERT + UPDATE' if update_existing else 'INSERT only (skip existing)'}")
    print()

    if not os.path.exists(csv_path):
        print(f"ERROR: CSV file not found: {csv_path}")
        sys.exit(1)

    conn = get_db_connection()
    cursor = conn.cursor()

    # Get existing product IDs
    cursor.execute("SELECT id FROM products")
    existing_ids = set(row[0] for row in cursor.fetchall())
    print(f"  Existing products in DB: {len(existing_ids)}")

    # Read CSV
    imported = 0
    updated = 0
    skipped = 0
    failed = 0

    with open(csv_path, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)

        for row_num, row in enumerate(reader, start=2):  # start=2 because row 1 is header
            try:
                product_id = parse_csv_value(row.get("id"), "int")

                name = parse_csv_value(row.get("name"))
                original_price = parse_csv_value(row.get("originalPrice"), "float")
                discounted_price = parse_csv_value(row.get("discountedPrice"), "float")
                description = parse_csv_value(row.get("description"))
                category = parse_csv_value(row.get("category"))
                rating = parse_csv_value(row.get("rating"), "float") or 4.5
                reviews = parse_csv_value(row.get("reviews"), "int") or 0
                sku = parse_csv_value(row.get("sku"))
                quantity = parse_csv_value(row.get("quantity"), "int") or 0
                image = parse_csv_value(row.get("image"))
                created_at = parse_csv_value(row.get("createdAt"), "datetime")
                updated_at = parse_csv_value(row.get("updatedAt"), "datetime")

                # Parse media JSON
                media_raw = row.get("media", "")
                media = parse_csv_value(media_raw, "json")
                media_json = json.dumps(media) if media else "[]"

                if not name:
                    print(f"  [SKIP] Row {row_num} -- no product name")
                    skipped += 1
                    continue

                if product_id and product_id in existing_ids:
                    if update_existing:
                        # UPDATE existing product
                        cursor.execute(
                            """UPDATE products SET
                                name = %s,
                                "originalPrice" = %s,
                                "discountedPrice" = %s,
                                description = %s,
                                category = %s,
                                rating = %s,
                                reviews = %s,
                                sku = %s,
                                quantity = %s,
                                image = %s,
                                media = %s,
                                "updatedAt" = %s
                            WHERE id = %s""",
                            (
                                name, original_price, discounted_price,
                                description, category, rating, reviews, sku, quantity,
                                image, media_json, updated_at, product_id
                            )
                        )
                        updated += 1
                        print(f"  [UPD] Product #{product_id}: {name[:50]}")
                    else:
                        print(f"  [SKIP] Product #{product_id} ({name[:40]}) -- already exists")
                        skipped += 1
                    continue

                if product_id:
                    # Insert with explicit ID
                    cursor.execute(
                        """INSERT INTO products 
                        (id, name, "originalPrice", "discountedPrice", description, category, 
                         rating, reviews, sku, quantity, image, media, "isActive", "createdAt", "updatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        (
                            product_id, name, original_price, discounted_price,
                            description, category, rating, reviews, sku, quantity,
                            image, media_json, True, created_at, updated_at
                        )
                    )
                else:
                    # Insert without explicit ID (auto-increment)
                    cursor.execute(
                        """INSERT INTO products 
                        (name, "originalPrice", "discountedPrice", description, category, 
                         rating, reviews, sku, quantity, image, media, "isActive", "createdAt", "updatedAt")
                        VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)""",
                        (
                            name, original_price, discounted_price,
                            description, category, rating, reviews, sku, quantity,
                            image, media_json, True, created_at, updated_at
                        )
                    )

                imported += 1
                print(f"  [OK] Product #{product_id or 'auto'}: {name[:50]}")

            except Exception as e:
                failed += 1
                print(f"  [FAIL] Row {row_num}: {str(e)[:80]}")
                conn.rollback()  # Rollback this row's transaction
                # Re-create connection state for next row
                conn = get_db_connection()
                cursor = conn.cursor()
                continue

    # Commit all successful inserts/updates
    try:
        conn.commit()
    except Exception as e:
        print(f"\nERROR committing: {e}")
        conn.rollback()

    # Reset sequence to max ID + 1 so future inserts get correct IDs
    try:
        cursor.execute("SELECT MAX(id) FROM products")
        max_id = cursor.fetchone()[0]
        if max_id:
            cursor.execute(f"SELECT setval('products_id_seq', {max_id}, true)")
            conn.commit()
            print(f"\n  Sequence reset to {max_id}")
    except Exception as e:
        print(f"\n  Note: Could not reset sequence: {e}")

    cursor.close()
    conn.close()

    print("\n" + "=" * 70)
    print("  Import Summary")
    print("=" * 70)
    print(f"  Imported:  {imported}")
    print(f"  Updated:   {updated}")
    print(f"  Skipped:   {skipped}")
    print(f"  Failed:    {failed}")
    print("=" * 70)

    if imported > 0 or updated > 0:
        print(f"\n  {imported} products imported, {updated} updated!")
        print(f"\n  Next steps:")
        print(f"  1. Restart the backend server")
        print(f"  2. Refresh the frontend")


if __name__ == "__main__":
    # Default CSV path
    default_path = os.path.join(os.path.dirname(__file__), "..", "products_rows (4).csv")

    # Parse args: [csv_path] [--update]
    args = sys.argv[1:]
    update_flag = "--update" in args
    csv_args = [a for a in args if a != "--update"]

    csv_path = csv_args[0] if csv_args else default_path
    csv_path = os.path.abspath(csv_path)

    import_csv(csv_path, update_existing=update_flag)
