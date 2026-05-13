# 🏸 Court Management System

Hệ thống quản lý sân (đặt sân, dịch vụ, thanh toán, khuyến mãi, đánh giá). Dự án tách biệt Backend/Frontend/Database và chạy dễ dàng bằng Docker Compose.
Đồ án môn IS208.

---

## 🚀 Tech Stack

### Frontend
- React 18 + Vite + TypeScript
- React Router DOM 6
- Axios
- Tailwind CSS 3
- Shadcn/UI style components

### Backend
- Java 17
- Spring Boot 3
- Spring Security 6
- Spring Data JPA / Hibernate
- JWT (stateless auth)
- Swagger UI qua `springdoc-openapi`
- Maven

### Database
- Oracle XE 21c (Docker image `gvenzl/oracle-xe:21-slim`)
- Init schema + seed mock data trong `database/init/*.sql`

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
- **Backend**: http://localhost:8080
- **Oracle XE**: localhost:1521

---

## ✅ Test nhanh / Swagger

- Backend health: http://localhost:8080/api/public/health
- Backend + DB health: http://localhost:8080/api/public/db-health
- Swagger UI:
  - Direct backend: http://localhost:8080/swagger-ui/index.html
  - Qua frontend proxy: http://localhost:5173/swagger-ui/index.html

### Tài khoản mock để test RBAC
- `admin` / `Admin@123`
- `staff1` / `Staff@123`
- `customer1` / `Customer@123`

---

## 🔧 Cấu hình môi trường .env

### Backend
- `SPRING_DATASOURCE_URL`: `jdbc:oracle:thin:@//oracle-db:1521/XEPDB1`
- `SPRING_DATASOURCE_USERNAME`: `app`
- `SPRING_DATASOURCE_PASSWORD`: `app123`
- `JWT_SECRET`: chuỗi secret dùng để ký JWT

### Database (mặc định trong compose)
- System password: `Oracle123!`
- App user/schema: `app`
- App password: `app123`

Init SQL:
- `database/init/*.sql` (Oracle tự chạy khi tạo data volume lần đầu)

---

## 📂 Cấu trúc thư mục

```
.
├── backend/            # Spring Boot + Security + JPA + JWT
├── frontend/           # React SPA + Router + Axios + Tailwind
├── database/           # Oracle init + mock data
├── docker-compose.yml  # Compose orchestration (db + backend + frontend)
└── README.md
```

├── docker-compose.yml  # Compose orchestration (db + backend + frontend)
└── README.md
```

---

## 🧹 Reset database (chạy lại init SQL)

Oracle chỉ chạy `database/init/*.sql` khi tạo volume lần đầu. Nếu muốn chạy lại:

```bash
docker compose down -v
docker compose up --build
```

---

## API Reference -Tài liệu tham khảo API

Base URL: `http://localhost:8080`

> Tất cả endpoint yêu cầu xác thực phải gửi kèm header:
> ```
> Authorization: Bearer <JWT_TOKEN>
> ```

---

###  Auth — `/api/auth` // api xác thực

#### `POST /api/auth/login`
Đăng nhập, nhận JWT token.

- **Auth**: Không cần
- **Request Body**:
```json
{
  "username": "customer1",
  "password": "Customer@123"
}
```
- **Response** `200 OK`:
```json
{
  "token": "<jwt_string>",
  "username": "customer1",
  "role": "CUSTOMER"
}
```

---

#### `POST /api/auth/register`
Đăng ký tài khoản khách hàng mới.

- **Auth**: Không cần
- **Request Body**:
```json
{
  "username": "newuser",
  "password": "Password@123",
  "email": "user@example.com",
  "fullName": "Nguyễn Văn A"
}
```
- **Response** `200 OK`:
```json
{
  "id": 10,
  "username": "newuser",
  "email": "user@example.com"
}
```

---

#### `GET /api/auth/me`
Lấy thông tin cơ bản của user đang đăng nhập.

- **Auth**: Đã đăng nhập (mọi role)
- **Response** `200 OK`:
```json
{
  "id": 3,
  "username": "customer1",
  "role": "CUSTOMER"
}
```

---

#### `GET /api/auth/profile`
Lấy profile chi tiết của user đang đăng nhập.

- **Auth**: Đã đăng nhập (mọi role)
- **Response** `200 OK`:
```json
{
  "id": 3,
  "username": "customer1",
  "email": "customer1@example.com",
  "fullName": "Khách Hàng Một",
  "phone": "0901234567"
}
```

---

###  Public — `/api/public`

Không yêu cầu xác thực.

#### `GET /api/public/health`
Kiểm tra server còn hoạt động.

- **Response** `200 OK`:
```json
{ "status": "ok" }
```

---

#### `GET /api/public/db-health`
Kiểm tra kết nối database.

- **Response** `200 OK`:
```json
{ "db": 1 }
```

---

#### `GET /api/public/courts`
Lấy danh sách tất cả sân.

- **Response** `200 OK`:
```json
[
  {
    "id": 1,
    "name": "Sân A1",
    "type": "BADMINTON",
    "status": "AVAILABLE",
    "pricePerHour": 80000
  }
]
```

---

#### `GET /api/public/courts/{courtId}`
Lấy thông tin chi tiết một sân theo ID.

- **Path Param**: `courtId` — ID của sân
- **Response** `200 OK`:
```json
{
  "id": 1,
  "name": "Sân A1",
  "type": "BADMINTON",
  "status": "AVAILABLE",
  "pricePerHour": 80000,
  "description": "Sân tiêu chuẩn thi đấu",
  "recentBookings": []
}
```

---

#### `GET /api/public/ratings/leaderboard`
Lấy bảng xếp hạng sân theo đánh giá.

- **Response** `200 OK`:
```json
[
  { "courtId": 2, "courtName": "Sân B1", "avgRating": 4.8, "totalReviews": 32 },
  { "courtId": 1, "courtName": "Sân A1", "avgRating": 4.5, "totalReviews": 21 }
]
```

---

###  Customer — `/api/customer` 

> **Yêu cầu role**: `CUSTOMER`

#### `GET /api/customer/bookings`
Lấy danh sách lịch đặt sân của khách hàng hiện tại.

- **Response** `200 OK`:
```json
[
  {
    "id": 5,
    "courtId": 1,
    "courtName": "Sân A1",
    "startTime": "2025-06-01T08:00:00",
    "endTime": "2025-06-01T10:00:00",
    "status": "CONFIRMED",
    "totalPrice": 160000
  }
]
```

---

#### `POST /api/customer/bookings`
Tạo booking mới.

- **Request Body**:
```json
{
  "courtId": 1,
  "startTime": "2025-06-05T09:00:00",
  "endTime": "2025-06-05T11:00:00"
}
```
- **Response** `200 OK`:
```json
{
  "id": 12,
  "courtId": 1,
  "courtName": "Sân A1",
  "startTime": "2025-06-05T09:00:00",
  "endTime": "2025-06-05T11:00:00",
  "status": "CONFIRMED",
  "totalPrice": 160000
}
```

---

#### `GET /api/customer/profile`
Lấy profile của khách hàng đang đăng nhập.

- **Response** `200 OK`: _(giống `/api/auth/profile`)_

---

###  Staff — `/api/staff` 

> **Yêu cầu role**: `STAFF` hoặc `ADMIN`

#### `GET /api/staff/bookings`
Lấy toàn bộ danh sách booking trong hệ thống.

- **Response** `200 OK`:
```json
[
  {
    "id": 5,
    "courtName": "Sân A1",
    "customerName": "Khách Hàng Một",
    "startTime": "2025-06-01T08:00:00",
    "endTime": "2025-06-01T10:00:00",
    "status": "CONFIRMED",
    "totalPrice": 160000
  }
]
```

---

#### `GET /api/staff/summary`
Lấy thống kê tổng quan hệ thống.

- **Response** `200 OK`:
```json
{
  "totalCourts": 10,
  "availableCourts": 6,
  "todayBookings": 14,
  "activeBookings": 3
}
```

---

###  Admin — `/api/admin` 

> **Yêu cầu role**: `ADMIN`

#### `GET /api/admin/revenue`
Lấy thống kê doanh thu.

- **Response** `200 OK`:
```json
{
  "totalRevenue": 12500000,
  "revenueThisMonth": 3200000,
  "revenueToday": 480000
}
```

---

###  Dashboard — `/api` // 

> **Yêu cầu**: Đã đăng nhập (mọi role). Dữ liệu trả về được lọc theo role.

#### `GET /api/dashboard`
Lấy toàn bộ dữ liệu dashboard trong một lần gọi.

- **Response** `200 OK`:
```json
{
  "me": { "id": 1, "username": "admin", "role": "ADMIN" },
  "summary": { "totalCourts": 10, "availableCourts": 6, "todayBookings": 14, "activeBookings": 3 },
  "courts": [ { "id": 1, "name": "Sân A1", "status": "AVAILABLE" } ],
  "leaderboard": [ { "courtId": 2, "courtName": "Sân B1", "avgRating": 4.8 } ],
  "myBookings": [],
  "staffBookings": [],
  "revenue": { "totalRevenue": 12500000, "revenueThisMonth": 3200000, "revenueToday": 480000 }
}
```

> **Lưu ý phân quyền**:
> - `myBookings` — chỉ có dữ liệu khi role là `CUSTOMER`
> - `staffBookings` — chỉ có dữ liệu khi role là `STAFF` hoặc `ADMIN`
> - `revenue` — chỉ có dữ liệu khi role là `ADMIN`

---

###  Mã lỗi phổ biến 

| HTTP Code | Ý nghĩa |
|-----------|---------|
| `400` | Request không hợp lệ (validation fail) |
| `401` | Chưa xác thực hoặc token hết hạn |
| `403` | Không đủ quyền truy cập |
| `404` | Không tìm thấy tài nguyên |
| `500` | Lỗi server nội bộ |
