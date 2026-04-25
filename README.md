# 🏸 Court Management System

Hệ thống quản lý sân (đặt sân, dịch vụ, thanh toán, khuyến mãi, đánh giá). Dự án tách biệt Backend/Frontend/Database và chạy dễ dàng bằng Docker Compose.

---

## 🚀 Tech Stack

### Frontend
- React + Vite (TypeScript)
- Dev server proxy API qua `/api/*` và truy cập Swagger qua `/docs`

### Backend
- **Framework**: FastAPI (Python 3.12)
- **Database driver**: asyncpg
- **API Docs**: Swagger UI (FastAPI built-in)

### Database
- PostgreSQL 16
- Init schema bằng SQL trong `database/init/*.sql`

### DevOps & Tools
- Docker & Docker Compose

---

## 🛠️ Cài đặt và Chạy dự án (Quick Start)

### Prerequisites
- Docker Desktop (có Docker Compose)
- Git (tuỳ chọn)

### 1) Chạy với Docker Compose
Tại thư mục gốc:

```bash
docker compose up --build
```

Sau khi chạy xong:
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:8000
- **PostgreSQL**: localhost:5432

---

## ✅ Test nhanh / Swagger

- Backend health: http://localhost:8000/health
- Backend + DB health: http://localhost:8000/db-health
- Swagger UI:
  - Direct backend: http://localhost:8000/docs
  - Qua frontend proxy: http://localhost:5173/docs
- Frontend gọi API qua proxy:
  - http://localhost:5173/api/health
  - http://localhost:5173/api/db-health
- OpenAPI JSON:
  - http://localhost:8000/openapi.json
  - http://localhost:5173/openapi.json

---

## 🔧 Cấu hình môi trường .env

### Backend
- `DATABASE_URL` (mặc định trong compose): `postgresql://app:app@db:5432/app`

### Database (mặc định trong compose)
- DB: `app`
- User: `app`
- Password: `app`

Init SQL:
- `database/init/*.sql` (Postgres tự chạy khi tạo data volume lần đầu)

---

## 📂 Cấu trúc thư mục

```
.
├── backend/            # FastAPI app (Python)
├── frontend/           # Nginx + static web + proxy config
├── database/           # SQL init scripts
├── docker-compose.yml  # Compose orchestration (db + backend + frontend)
└── README.md
```

---

## 🧹 Reset database (chạy lại init SQL)

Postgres chỉ chạy `database/init/*.sql` khi tạo volume lần đầu. Nếu muốn chạy lại:

```bash
docker compose down -v
docker compose up --build
```
