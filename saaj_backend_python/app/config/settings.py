from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    # AWS RDS PostgreSQL
    Host: str = "localhost"
    Port: int = 5432
    database_name: str = "saajjewels"
    Username: str = "postgres"
    Password: str = "postgres"

    # AWS S3
    AWS_ACCESS_KEY_ID: str = ""
    AWS_SECRET_ACCESS_KEY: str = ""
    AWS_S3_BUCKET_NAME: str = "saajjewels-media"
    AWS_S3_REGION: str = "ap-south-1"

    # Clerk
    CLERK_SECRET_KEY: str = ""
    CLERK_PUBLISHABLE_KEY: str = ""
    CLERK_JWKS_URL: str = ""

    # Admin
    ADMIN_TOKEN: str = ""

    # Razorpay
    RAZORPAY_API_KEY: str = ""
    RAZORPAY_API_SECRET: str = ""

    # CORS (comma-separated origins, leave empty to use defaults)
    CORS_ORIGINS: str = ""

    # Email (SMTP)
    EMAIL_HOST: str = "smtp.gmail.com"
    EMAIL_PORT: int = 587
    EMAIL_USER: str = ""
    EMAIL_PASSWORD: str = ""
    EMAIL_FROM: str = "no-reply@saajjewel.in"

    @property
    def DATABASE_URL(self) -> str:
        return (
            f"postgresql+asyncpg://{self.Username}:{self.Password}"
            f"@{self.Host}:{self.Port}/{self.database_name}"
        )

    @property
    def DATABASE_URL_SYNC(self) -> str:
        return (
            f"postgresql+psycopg2://{self.Username}:{self.Password}"
            f"@{self.Host}:{self.Port}/{self.database_name}"
        )

    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    return Settings()
