# Hợp đồng API — Đồng bộ đặt sân giữa App hội viên và Hệ thống quản trị

> Phiên bản: `v1` (draft) · Cập nhật: 2026-11-28
> Mục đích: định nghĩa API để **App hội viên** tạo lượt đặt / cọc sân và **Hệ thống quản trị cơ sở** (màn *Lịch đặt sân*) nhận, hiển thị và cập nhật các lượt đó theo thời gian thực.

---

## 1. Bối cảnh & kiến trúc

Hai hệ thống độc lập, kết nối qua HTTP API (không dùng chung CSDL):

| Hệ thống | Vai trò | Gọi API nào |
|---|---|---|
| **App hội viên** (Member App) | Khách chọn sân → thanh toán/cọc → nhận mã đặt sân | `GET /courts`, `GET /availability`, `POST /bookings` |
| **Hệ thống quản trị** (Venue/Admin) | Nguồn sự thật (source of truth) về sân & lịch; lễ tân xem *Lịch đặt sân*, check-in, thu nốt cọc | Cung cấp toàn bộ endpoint; nhận `POST /bookings`; đẩy `webhook` khi lịch đổi |
| **Cổng thanh toán** (Payment Gateway) | Xác nhận tiền vào (VietQR, ví, thẻ) | Gọi `webhook` thanh toán về Hệ thống quản trị |

**Hệ thống quản trị là chủ dữ liệu.** App hội viên không tự quyết trạng thái lịch — mọi lượt đặt phải được quản trị xác nhận (chống đặt trùng). Luồng tổng quát:

```
Member App ──POST /bookings──▶ Venue/Admin ──(hiện trên Lịch đặt sân)
     ▲                              ▲
     │                              │ webhook: payment.succeeded
     └──── booking.confirmed ◀──────┤
  (webhook / polling)        Payment Gateway
```

---

## 2. Quy ước chung

- **Base URL:** `https://api.arena.vn/v1` (versioning trên path).
- **Định dạng:** `application/json; charset=utf-8`. Mọi thời điểm theo **ISO 8601 có timezone** (`2026-11-28T19:00:00+07:00`). Cơ sở có `timezone` riêng (mặc định `Asia/Ho_Chi_Minh`).
- **Tiền:** số nguyên **đồng (VND)**, không phần thập phân (vd. `135000`).
- **Xác thực:**
  - App hội viên → quản trị: `Authorization: Bearer <access_token>` (OAuth2, token gắn `memberId` + `venueId`).
  - Server-to-server (webhook, back-office): `X-Api-Key: <key>` + chữ ký `X-Signature` (HMAC-SHA256 của raw body, xem §8).
- **Idempotency:** mọi `POST` ghi dữ liệu phải gửi `Idempotency-Key: <uuid>`. Gửi lại cùng key trả về đúng kết quả cũ (không tạo trùng).
- **Phân trang:** `?page=1&limit=50` → response có `meta: { page, limit, total }`.
- **Phiên bản đổi phá vỡ (breaking) → tăng path version** (`/v2`). Thêm field không phá vỡ.

---

## 3. Mô hình dữ liệu

### 3.1 Court (sân) — `GET /courts`
Phản ánh cấu hình sân, gồm cả chế độ đặt bật theo từng sân.

```jsonc
{
  "id": "cl2",
  "name": "Cầu lông 2",
  "sport": "cl",              // cl | pb | tn | bd  (cầu lông, pickleball, tennis, bóng đá mini)
  "surface": "Thảm PVC",      // mô tả mặt sân
  "pricePerHour": 150000,
  "status": "active",         // active | hidden | locked (locked = tạm ngừng/bảo trì)
  "modes": {                  // chế độ đặt BẬT theo từng sân (do chủ sân cấu hình)
    "court": true,            // đặt nguyên sân — luôn true
    "ticket": true,           // bán vé lượt (xé vé)
    "pickup": true            // ghép trận (pickup)
  }
}
```

### 3.2 Cấu hình giá chế độ (dùng chung cả cơ sở) — `GET /venues/{id}/booking-config`
```jsonc
{
  "ticketPrice": 50000,   // giá vé / người
  "pickupCap": 8,         // sức chứa mặc định / trận
  "pickupPrice": 60000,   // giá pickup / người
  "memberDiscountPct": 10,
  "depositPct": 50,       // % cọc tối thiểu để giữ sân giờ cao điểm
  "holdMinutes": 10       // thời gian giữ chỗ chờ thanh toán
}
```

### 3.3 Booking (lượt đặt) — đối tượng trung tâm
```jsonc
{
  "id": "bk_01H...",              // id do quản trị cấp
  "code": "ĐS-7831",             // mã hiển thị cho khách
  "venueId": "q7",
  "courtId": "cl1",
  "sport": "cl",
  "start": "2026-10-18T20:00:00+07:00",
  "end":   "2026-10-18T21:00:00+07:00",
  "mode": "court",               // court | ticket | pickup
  "state": "booked",             // booked | pending | class | blocked  (xem §4)
  "source": "member_app",        // member_app | admin | partner
  "customer": {
    "memberId": "AR-00421",      // null nếu khách lẻ
    "name": "Minh Anh",
    "phone": "0912345678"
  },
  "payment": {
    "type": "full",              // full | deposit
    "status": "paid",            // unpaid | paid | refunded
    "method": "vietqr",          // vietqr | wallet | card | desk
    "amountTotal": 135000,
    "amountPaid": 135000,
    "amountDue": 0,              // còn phải thu (tại quầy)
    "currency": "VND"
  },
  // theo chế độ:
  "ticket":  { "count": 2 },                       // chỉ khi mode=ticket
  "pickup":  { "players": 1, "capacity": 8 },      // chỉ khi mode=pickup
  "checkedIn": false,
  "note": "Đặt qua app",
  "createdAt": "2026-10-18T19:42:11+07:00",
  "updatedAt": "2026-10-18T19:42:11+07:00"
}
```

> **Ánh xạ sang UI hiện tại (tham khảo):** `label` ở lịch = `customer.name`; `sub` = tóm tắt thanh toán (vd. `"App · đã thu 135.000₫"` hoặc `"App · cọc 67.500₫, còn 67.500₫"`); `start/span` theo giờ nguyên hiện tại suy ra từ `start/end`.

---

## 4. Trạng thái & ánh xạ

`state` của Booking (khớp màn *Lịch đặt sân*):

| `state` | Ý nghĩa | Màu trên lịch |
|---|---|---|
| `booked` | Đã đặt & đã thu đủ tiền | Xanh (Đã đặt) |
| `pending` | Giữ chỗ, **chưa đủ tiền** (chờ cọc / chờ thanh toán) | Cam (Chờ cọc) |
| `class` | Lớp học / PT cố định | — |
| `blocked` | Bảo trì / tạm ngừng | Xám |

**Quy tắc suy ra `state` từ `payment`** (quản trị quyết định, app chỉ gửi ý định):

| `payment.type` | `payment.method` | `payment.status` | → `state` |
|---|---|---|---|
| `full` | vietqr / wallet / card | `paid` | `booked` |
| `deposit` | vietqr / wallet / card | `paid` (đã cọc) | `pending` (còn `amountDue`) |
| `deposit` / `full` | `desk` (trả tại quầy) | `unpaid` | `pending` |
| bất kỳ | — | hết `holdMinutes` chưa `paid` | lượt bị **huỷ tự động** (slot nhả ra) |

---

## 5. Endpoints

### 5.1 `GET /courts` — danh sách sân nhận đặt qua app
Query: `?venueId=q7`
→ `200` `{ "data": [ Court, ... ] }` (bỏ sân `hidden`/`locked`).

### 5.2 `GET /availability` — khung giờ trống
Query: `?venueId=q7&courtId=cl1&date=2026-10-18`
```jsonc
// 200
{
  "courtId": "cl1",
  "date": "2026-10-18",
  "openTime": "06:00", "closeTime": "23:00",
  "slots": [
    { "start": "2026-10-18T19:00:00+07:00", "available": false },
    { "start": "2026-10-18T20:00:00+07:00", "available": true,  "price": 135000 }
  ]
}
```
`price` là giá áp cho khách gọi (đã trừ ưu đãi hội viên nếu token là hội viên).

### 5.3 `POST /bookings` — App tạo lượt đặt / cọc  ⭐ (endpoint cốt lõi)
Headers: `Authorization`, `Idempotency-Key`.
```jsonc
// Request
{
  "venueId": "q7",
  "courtId": "cl1",
  "start": "2026-10-18T20:00:00+07:00",
  "durationHours": 1,
  "mode": "court",                 // court | ticket | pickup
  "customer": { "memberId": "AR-00421", "name": "Minh Anh", "phone": "0912345678" },
  "payment": { "type": "full", "method": "vietqr", "amountTotal": 135000 },
  // tuỳ chế độ:
  "ticket": { "count": 2 },        // nếu mode=ticket
  "pickup": { "players": 1 },      // nếu mode=pickup (capacity lấy theo cấu hình sân)
  "addons": [ { "code": "racket", "qty": 1 } ]   // tuỳ chọn, vd. thuê vợt
}
```
```jsonc
// 201 Created
{
  "data": Booking,                 // đã có id, code, state
  "payment": {
    "status": "pending",           // chờ cổng thanh toán xác nhận (nếu online)
    "qr": "https://.../vietqr/...", // nếu method=vietqr
    "expiresAt": "2026-10-18T19:52:00+07:00"
  }
}
```
Hành vi:
- Quản trị **giữ chỗ (hold)** slot ngay, `state=pending`, hết `expiresAt` chưa `paid` thì nhả.
- Khi cổng thanh toán báo `paid` (§6) → quản trị chuyển `state` theo §4 và đẩy webhook `booking.confirmed`.
- Nếu `method=desk`: tạo luôn `state=pending`, không có QR, thu tại quầy.

Lỗi thường gặp: `409 slot_taken`, `409 idempotency_replay` (trả booking cũ), `422 mode_not_allowed` (sân không bật chế độ đó), `422 validation_error`.

### 5.4 `GET /bookings` — Quản trị lấy lịch (và app xem đơn của mình)
Query: `?venueId=q7&date=2026-10-18` (admin) hoặc `?memberId=AR-00421&from=...&to=...` (app).
→ `200` `{ "data": [ Booking, ... ], "meta": {...} }`.
Hỗ trợ đồng bộ chênh lệch: `?updatedSince=2026-10-18T19:40:00+07:00` để lấy các thay đổi từ mốc đó (fallback khi không dùng webhook).

### 5.5 `PATCH /bookings/{id}` — cập nhật
Dùng cho lễ tân: check-in, thu nốt cọc, đổi giờ.
```jsonc
// Request (ví dụ thu nốt cọc tại quầy)
{ "payment": { "amountPaid": 135000, "status": "paid" }, "checkedIn": true }
// 200 → Booking (state có thể chuyển pending → booked)
```

### 5.6 `POST /bookings/{id}/cancel` — huỷ
```jsonc
{ "reason": "member_request" }   // member_request | no_show | venue
// 200 → Booking { state giữ nguyên nhưng bị gỡ khỏi lịch, payment.status có thể = refunded }
```
Chính sách huỷ/hoàn do cơ sở quy định (vd. miễn phí trước 4 giờ) — trả trong `cancellation` của response.

---

## 6. Đồng bộ thời gian thực (webhook)

Hệ thống quản trị đẩy webhook tới URL đã đăng ký của mỗi bên để màn *Lịch đặt sân* và app cập nhật tức thì (thay cho polling).

**Sự kiện:**
| event | Khi nào | Payload |
|---|---|---|
| `booking.created` | Có lượt đặt mới (từ app) | `{ event, data: Booking }` |
| `booking.confirmed` | Thanh toán thành công → lên `booked` | `{ event, data: Booking }` |
| `booking.updated` | Đổi trạng thái/giờ/check-in | `{ event, data: Booking }` |
| `booking.cancelled` | Huỷ / hết hạn giữ chỗ | `{ event, data: Booking }` |
| `payment.succeeded` | Cổng thanh toán xác nhận (gateway → quản trị) | `{ event, bookingId, amountPaid }` |

**Chuẩn gửi:** `POST` JSON kèm `X-Signature` (HMAC-SHA256). Bên nhận phản hồi `2xx` trong 5s; thất bại thì **retry** lũy tiến (vd. 1m, 5m, 30m, 2h) tối đa 24h. Mỗi event có `id` duy nhất để bên nhận chống xử lý trùng.

```jsonc
// Ví dụ webhook booking.confirmed
{
  "id": "evt_01HX...",
  "event": "booking.confirmed",
  "sentAt": "2026-10-18T19:43:02+07:00",
  "data": { /* Booking đầy đủ, state=booked */ }
}
```

> Không dùng webhook được thì dùng **polling** `GET /bookings?updatedSince=` mỗi 15–30s.

---

## 7. Chống đặt trùng & nhất quán

- Quản trị là trọng tài cuối: `POST /bookings` kiểm tra lại slot trong **transaction**, trả `409 slot_taken` nếu đã có lượt chồng giờ (`existing.start < new.end && new.start < existing.end`).
- Giữ chỗ có `expiresAt`; hết hạn tự nhả để không khoá slot vô hạn.
- `Idempotency-Key` chống tạo trùng khi app retry mạng.
- Mỗi Booking có `updatedAt` + (khuyến nghị) `version` để cập nhật lạc quan (optimistic), tránh ghi đè chéo giữa lễ tân và app.

---

## 8. Bảo mật

- **TLS bắt buộc** mọi endpoint.
- Token hội viên chỉ thao tác được booking của chính `memberId` trong token; đọc lịch cơ sở ở mức khung giờ (không lộ thông tin khách khác ngoài thông tin tối thiểu).
- Webhook ký `X-Signature = HMAC_SHA256(secret, raw_body)`; bên nhận so khớp trước khi xử lý, kiểm tra `sentAt` lệch ≤ 5 phút chống replay.
- Không đưa số điện thoại/PII lên query string; chỉ trong body đã mã hoá TLS.
- Rate limit theo token (vd. 60 req/phút) → `429 rate_limited` kèm `Retry-After`.

---

## 9. Lỗi chuẩn

HTTP code + thân JSON thống nhất:
```jsonc
{
  "error": {
    "code": "slot_taken",            // mã máy đọc được
    "message": "Khung 20:00–21:00 đã có người đặt.",
    "field": "start",                // nếu lỗi validate
    "requestId": "req_01HX..."
  }
}
```
| HTTP | `code` tiêu biểu |
|---|---|
| 400 | `validation_error` |
| 401 | `unauthorized` · `invalid_token` |
| 403 | `forbidden` |
| 404 | `court_not_found` · `booking_not_found` |
| 409 | `slot_taken` · `idempotency_replay` |
| 422 | `mode_not_allowed` · `court_locked` · `payment_amount_mismatch` |
| 429 | `rate_limited` |
| 5xx | `internal_error` (an toàn để retry nếu có Idempotency-Key) |

---

## 10. Checklist cho đội backend

- [ ] Phát hành/validate token hội viên gắn `venueId` + `memberId`.
- [ ] `GET /courts`, `GET /availability`, `GET /venues/{id}/booking-config`.
- [ ] `POST /bookings` với giữ chỗ + `Idempotency-Key` + kiểm tra trùng trong transaction.
- [ ] Tích hợp cổng thanh toán → `payment.succeeded` → chuyển `state` theo §4.
- [ ] `GET /bookings?date=` và `?updatedSince=` cho màn Lịch đặt sân.
- [ ] `PATCH /bookings/{id}` (check-in, thu nốt cọc) + `POST /bookings/{id}/cancel`.
- [ ] Webhook ký HMAC + retry + chống xử lý trùng theo `event.id`.
- [ ] Job tự huỷ lượt giữ chỗ quá `holdMinutes`.

---

*Phụ lục — enum tham chiếu:* `sport: cl|pb|tn|bd` · `mode: court|ticket|pickup` · `state: booked|pending|class|blocked` · `payment.type: full|deposit` · `payment.method: vietqr|wallet|card|desk` · `payment.status: unpaid|paid|refunded`.
