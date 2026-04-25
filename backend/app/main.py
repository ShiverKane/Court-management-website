from contextlib import asynccontextmanager

from fastapi import FastAPI, Request

from .db import create_pool


@asynccontextmanager
async def lifespan(app: FastAPI):
    pool = await create_pool()
    app.state.pg_pool = pool
    try:
        yield
    finally:
        await pool.close()


app = FastAPI(
    title="Court Management API",
    version="0.1.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok"}


@app.get("/db-health")
async def db_health(request: Request):
    pool = request.app.state.pg_pool
    async with pool.acquire() as conn:
        value = await conn.fetchval("SELECT 1")
    return {"db": value}
