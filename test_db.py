"""Quick DB connection test — run on EC2 to diagnose RDS connectivity."""
import socket
import sys

HOST = "saajjewels.cxauscwkev1y.ap-south-1.rds.amazonaws.com"
PORT = 5432
USER = "Saajjewels4231"
PASS = "aQQwYbXFk1zY0QOp6GhO"
DB   = "postgres"

print(f"1) Testing TCP connection to {HOST}:{PORT} ...")
try:
    sock = socket.create_connection((HOST, PORT), timeout=5)
    sock.close()
    print("   TCP connection: OK\n")
except Exception as e:
    print(f"   TCP connection: FAILED — {e}")
    print("\n   => Your EC2 cannot reach the RDS instance on port 5432.")
    print("   => Check RDS Security Group inbound rules — allow port 5432")
    print("      from this EC2's security group or IP.")
    sys.exit(1)

print("2) Testing PostgreSQL login ...")
try:
    import psycopg2
    conn = psycopg2.connect(
        host=HOST, port=PORT, user=USER, password=PASS, dbname=DB,
        connect_timeout=5, sslmode="require"
    )
    cur = conn.cursor()
    cur.execute("SELECT version();")
    ver = cur.fetchone()[0]
    cur.close()
    conn.close()
    print(f"   DB login: OK")
    print(f"   PostgreSQL version: {ver}\n")
except ImportError:
    print("   psycopg2 not installed locally — trying asyncpg ...\n")
    try:
        import asyncio
        import asyncpg
        import ssl as _ssl

        async def test():
            ssl_ctx = _ssl.create_default_context()
            ssl_ctx.check_hostname = False
            ssl_ctx.verify_mode = _ssl.CERT_NONE
            conn = await asyncpg.connect(
                host=HOST, port=PORT, user=USER, password=PASS,
                database=DB, ssl=ssl_ctx, timeout=5
            )
            ver = await conn.fetchval("SELECT version();")
            await conn.close()
            return ver

        ver = asyncio.run(test())
        print(f"   DB login: OK")
        print(f"   PostgreSQL version: {ver}\n")
    except Exception as e:
        print(f"   DB login: FAILED — {e}\n")
        print("   => TCP works but authentication failed.")
        print("   => Double-check Username, Password, and database_name.")
        sys.exit(1)
except Exception as e:
    print(f"   DB login: FAILED — {e}\n")
    print("   => TCP works but authentication failed.")
    print("   => Double-check Username, Password, and database_name.")
    sys.exit(1)

print("3) ALL TESTS PASSED — DB connection is working!")
