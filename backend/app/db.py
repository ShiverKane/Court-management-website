import asyncpg

from .core.config import get_database_url


async def create_pool() -> asyncpg.Pool:
    return await asyncpg.create_pool(dsn=get_database_url())
