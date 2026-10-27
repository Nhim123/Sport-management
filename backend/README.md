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

```bash
npm install
cp .env.example .env
npm run db:push     # tạo schema vào SQLite (prisma/dev.db)
npm run db:seed     # nạp dữ liệu mẫu
npm run dev         # chạy dev tại http://localhost:4000/api/v1
```

`npm run db:reset` để tạo lại DB sạch và seed lại.

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

## Đổi sang PostgreSQL

1. Trong `prisma/schema.prisma`, đổi `provider = "sqlite"` → `"postgresql"`.
2. Đặt `DATABASE_URL` trong `.env` theo chuỗi Postgres.
3. `npm run db:push && npm run db:seed`.

## Nối với frontend

Trong `frontend/.env` đặt:

```
EXPO_PUBLIC_API_URL=http://localhost:4000/api/v1
EXPO_PUBLIC_USE_MOCK=false
```
