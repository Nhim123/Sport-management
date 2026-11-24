# Arena Backend

REST API cho ứng dụng Arena (quản lý cơ sở thể thao). **Node + Express + TypeScript + Prisma**.

## Cấu trúc

```
backend/
├── prisma/
│   ├── schema.prisma     # Mô hình DB (Court, Booking, ClassSession, PayMethod, Member, ScheduleItem)
│   └── seed.ts           # Nạp dữ liệu mẫu (khớp frontend/src/mocks/data.ts)
├── src/
│   ├── config/           # env.ts, db.ts (Prisma client)
│   ├── middlewares/      # asyncHandler, errorHandler (+ HttpError)
│   ├── modules/          # Theo domain — mỗi module: service · routes (+ schema)
│   │   ├── courts/
│   │   ├── classes/
│   │   ├── members/
│   │   ├── payments/
│   │   └── bookings/
│   ├── routes/           # Gom router dưới /api/v1
│   ├── app.ts            # Khởi tạo Express (cors, json, routes, error handler)
│   └── server.ts         # Điểm vào (listen)
└── .env.example
```

## Chạy

Cần Node ≥ 20 và PostgreSQL. Cách nhanh nhất là chạy Postgres trong Docker (cần Docker Desktop):

```bash
npm install
cp .env.example .env
npm run db:up       # Postgres 16 trong Docker, khớp DATABASE_URL / DIRECT_URL mặc định
npm run db:deploy   # áp các migration vào DB
npm run db:seed     # nạp dữ liệu mẫu
npm run dev         # chạy dev tại http://localhost:4000/api/v1
```

- `npm run db:reset`: xoá sạch DB, áp lại migration và seed.
- Đổi `prisma/schema.prisma` xong thì chạy `npm run db:migrate -- --name <mô-tả>`. Lệnh này tạo migration mới trong `prisma/migrations/`; nhớ commit thư mục đó.

## Endpoints (`/api/v1`)

| Method | Path | Mô tả |
|---|---|---|
| GET | `/health` | Kiểm tra sống |
| GET | `/courts` | Danh sách sân |
| GET | `/courts/:id/taken?day=0` | Giờ đã kín của sân trong ngày |
| GET | `/classes` | Lớp học |
| GET | `/members/me` | Hồ sơ hội viên |
| GET | `/members/me/schedule` | Lịch của hội viên |
| GET | `/payments/methods` | Phương thức thanh toán |
| POST | `/bookings` | Tạo lượt đặt sân |

`POST /bookings` body: `{ courtId, dayIndex, hour, racket, method }` → `{ code, courtId, dayIndex, hour, total }`.

## Deploy

Phương án đề xuất: Supabase (Postgres) + Render (Docker), đều chọn vùng Singapore cho gần Việt Nam.

1. **CSDL (Supabase):**
   - Tạo project mới, Region **Southeast Asia (Singapore)**, đặt mật khẩu database và lưu lại.
   - Vào nút **Connect** → tab **ORM** → **Prisma** để lấy hai chuỗi:
     - `DATABASE_URL`: *Transaction pooler* (cổng 6543), có `?pgbouncer=true&connection_limit=1`.
     - `DIRECT_URL`: *Session pooler* (cổng 5432). Prisma dùng chuỗi này khi chạy migration.
   - Dùng pooler thay vì *Direct connection*, vì direct connection chỉ có IPv6 mà Render không kết nối được.
   - Gói Free tạm dừng project sau 7 ngày không có truy cập. Chạy thật thì nên lên gói Pro.
2. **API (Render):**
   - Vào New → Web Service → chọn repo. Root Directory `backend`, Runtime **Docker**, Region Singapore.
   - Environment:
     - `DATABASE_URL` và `DIRECT_URL` = hai chuỗi của Supabase ở trên
     - `CORS_ORIGIN=https://admin.<tên-miền>`
     - `NODE_ENV=production`
   - Không cần đặt `PORT` vì Render tự cấp.
   - Health Check Path: `/api/v1/health`.
   - Mỗi lần deploy, container tự chạy `prisma migrate deploy` (qua `DIRECT_URL`) trước khi mở API, xem `Dockerfile`.
3. **Dữ liệu mẫu (tuỳ chọn, chạy một lần từ máy dev):** đặt hai chuỗi Supabase vào `.env` rồi chạy `npm run db:deploy && npm run db:seed`.
4. **Tên miền:** thêm custom domain `api.<tên-miền>` trên Render, rồi tạo CNAME tương ứng ở nhà quản lý DNS. HTTPS được cấp tự động.

Backend chỉ dùng Supabase như một PostgreSQL thông thường (qua Prisma), chưa dùng Supabase Auth hay Storage.

Thử ảnh Docker trên máy:

```bash
docker build -t arena-api .
docker run --rm -p 4000:4000 \
  -e DATABASE_URL="postgresql://arena:arena@host.docker.internal:5432/arena" \
  -e DIRECT_URL="postgresql://arena:arena@host.docker.internal:5432/arena" arena-api
curl http://localhost:4000/api/v1/health
```

Ảnh chỉ dùng biến môi trường và PostgreSQL chuẩn, nên chuyển sang VPS, Fly.io hay Cloud Run không phải sửa code.

## Nối với frontend

Trong `frontend/.env` đặt:

```
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
EXPO_PUBLIC_USE_MOCK=false
```

Với bản build EAS, đặt `EXPO_PUBLIC_API_URL` trên expo.dev (Project → Environment variables, môi trường *preview* / *production*) hoặc trong mục `env` của profile ở `frontend/eas.json`.
