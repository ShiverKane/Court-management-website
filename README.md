# Court Management Website — Template

## Yêu cầu

- Docker Desktop (có Docker Compose)

## Chạy lần đầu

```bash
docker compose up --build
```

Mặc định sẽ chạy 3 service:

- Frontend (Nginx + static): http://localhost:8080
- Backend (FastAPI): http://localhost:8000
- PostgreSQL: localhost:5432

## Kiểm tra nhanh

- Backend health: http://localhost:8000/health
- Backend + DB health: http://localhost:8000/db-health
- Swagger UI:
  - Backend trực tiếp: http://localhost:8000/docs
  - Qua frontend proxy: http://localhost:8080/docs
- Frontend gọi API qua proxy:
  - http://localhost:8080/api/health
  - http://localhost:8080/api/db-health

## Cấu hình môi trường

Backend dùng biến môi trường:

- `DATABASE_URL` (mặc định): `postgresql://app:app@db:5432/app`

Database mặc định:

- DB: `app`
- User: `app`
- Password: `app`

SQL khởi tạo đặt trong:

- `database/init/*.sql` (Postgres sẽ tự chạy khi tạo data volume lần đầu)

## Lưu ý

- Nếu đã từng chạy và muốn chạy lại phần init SQL, cần xoá volume `pgdata` rồi chạy lại:

```bash
docker compose down -v
docker compose up --build
```
