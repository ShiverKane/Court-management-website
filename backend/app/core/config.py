import os


def get_database_url() -> str:
    return os.getenv("DATABASE_URL", "postgresql://app:app@db:5432/app")
