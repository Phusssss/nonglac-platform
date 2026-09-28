# AUTH-08: ĐẶC TẢ AUTH + RBAC (v3 — thêm OTP kích hoạt + quên PIN)

**Nguồn**: FSD-02 §1 (ma trận RBAC), UI-06 MH-01, DOD-05 §2, PLAN P2-1/P2-2/P2-3

---

## 1. LOGIN — `POST /api/v1/auth/login`

MH-01 đăng nhập bằng **SĐT + PIN 4–6 số** (không phải email). Backend lưu
bcrypt(cost 12) của PIN vào `users.password_hash`. Seed P1-4 để placeholder,
P2-1 ghi đè bằng PIN demo khi dựng môi trường dev.

Request: `{ "phone": "0900000003", "pin": "123456" }`
Response 200: `{ "access_token": "jwt-15p", "user": {id, full_name, role, farm_ids} }`
+ Set-Cookie `refresh_token` (HttpOnly, Secure, SameSite=Strict, 30 ngày).
  Dev local (http) cho phép `Secure=false` qua env; staging/prod bắt buộc https.
  WebSocket audit stream (P2-11) xác thực bằng cùng access JWT qua query `?token=`.

Claims JWT: `sub, role, farm_ids, type=access`. Access chỉ giữ trong memory
mobile/web (đúng DOD-05 §2), không lưu localStorage.

Luồng MH-01:
- Có mạng → login → lưu access (memory) + refresh (SecureStore mobile / cookie web) → MH-02.
- Offline → nút `[VÀO CHẾ ĐỘ OFFLINE]`: app so PIN nhập với hash PIN đã cache
  trong SecureStore (lưu ở lần login online gần nhất), đúng → vào MH-02 cờ
  `isOfflineMode=true`, sai → lỗi đỏ MH-01. Server không tham gia nhánh này.

## 2. REFRESH / LOGOUT

- `POST /api/v1/auth/refresh` (đọc cookie/token): xoay refresh mới (rotation),
  phát hiện **reuse** (token cũ dùng lại) → thu hồi cả chuỗi + audit `TOKEN_REUSE`.
- `POST /api/v1/auth/logout`: thu hồi refresh hiện tại.
- Refresh lưu Redis kèm `device_id` (cho phép user xem/thu hồi từng thiết bị — mở rộng sau).

## 3. CHỐNG BRUTE-FORCE (PIN yếu → DOD-05 rate limit là chưa đủ)

- DOD-05: Redis Throttler 100 req/phút/IP (P2-3).
- Thêm khóa login: **5 sai liên tiếp / 1 SĐT → khóa 15 phút** (đếm trong Redis
  key `login_fail:<phone>`), response 429 + thông báo MH-01 "thử lại sau".
- Bcrypt cost 12 để mỗi lần đoán tốn ~250ms.

## 4. MA TRẬN RBAC → RULE TRIỂN KHAI (mở rộng từ FSD-02 §1)

| Nhóm chức năng (endpoint) | SUPER_ADMIN | OWNER | MANAGER | AGRONOMIST | WORKER | BUYER |
|---|:---:|:---:|:---:|:---:|:---:|:---:|
| Quản trị tenant (`/admin/*`) | X | - | - | - | - | - |
| Vẽ entity (`POST/PATCH/DELETE /farms, /entities`) | - | X | X | - | - | - |
| Mùa vụ + vật tư (`/seasons, /materials`) | - | X | X | X | - | - |
| Giao việc (`POST/PATCH /tasks`) | - | X | X | - | - | - |
| Đọc việc được giao (`GET /tasks?assignee=me`) | - | X | X | X | **X (chỉ việc của mình)** | - |
| Ghi nhật ký (`POST /activities, /sync/push`) | - | - | X | X | X | - |
| Audit/duyệt (`GET /audit, POST /audit/:id/review`) | - | X | X | X | - | - |
| Chợ + trace (`GET /products, /trace/*` public) | X | X | X | X | X | X (không cần login) |

Hai guard lồng nhau: `RolesGuard` (role) + `FarmGuard` (user thuộc `farm_id`
đang thao tác — chống WORKER farm A push log farm B). Mọi từ chối ghi `audit_logs`.

## 5. TEST MATRIX (42 case rút gọn + token)

- Mỗi ô X trong bảng = 1 case 200; mỗi ô `-` = 1 case 403 (viết dạng parameterized,
  chạy cho cả 6 roles × 8 nhóm).
- Token: access hết 15p → 401; refresh xoay → dùng lại token cũ → 401 + thu hồi chuỗi;
  5 PIN sai → 429 khóa 15p; offline mode sai PIN cache → ở lại MH-01 + lỗi đỏ.
- Public: `GET /trace/:batchId` không token vẫn 200 (MH-16).

## 6. ACCEPTANCE

- MH-01 đủ 4 states (loading spinner, sai PIN, input rỗng, offline sáng nút).
- Ma trận test xanh 100%; reuse refresh luôn thu hồi chuỗi; audit có log mọi 403.

## 7. OTP — KÍCH HOẠT + QUÊN PIN (bổ sung theo yêu cầu, ngoài tài liệu gốc)

DB: `otp_codes` + `users.phone_verified_at` (`infra/postgres/04-otp.sql`).
OTP 6 số, bcrypt hash (không lưu plaintext), hiệu lực 10 phút, tối đa 5 lần nhập,
1 mã 1 việc (`consumed_at`). Login hằng ngày KHÔNG dùng OTP (tốn SMS, kẹt offline).

### 7a. Kích hoạt tài khoản mới (chống số ảo/rác)

1. OWNER/MANAGER tạo worker (SĐT + tên) → user `is_active=false`,
   `phone_verified_at=NULL` → hệ thống gửi OTP.
2. Worker nhập OTP ở màn kích hoạt → đúng + còn hạn → `is_active=true`,
   `phone_verified_at=NOW()` → đặt PIN lần đầu → login bình thường.
3. Sai 5 lần / hết hạn → vô hiệu mã, admin gửi lại (rate limit gửi: 1 SMS/phút/SĐT).

### 7b. Quên PIN

MH-01 `[Quên PIN]` → nhập SĐT → OTP → nhập PIN mới 2 lần (4–6 số, khác PIN cũ) →
đổi hash + thu hồi toàn bộ refresh cũ (đá các thiết bị khác ra) + audit `PIN_RESET`.
Seed/admin-tạo coi như verified, không bắt OTP ngược.

### 7c. SMS gateway (chốt kiến trúc, chưa chốt nhà cung cấp)

Backend gọi qua interface `SmsProvider`: dev dùng `LogSmsProvider` (ghi log +
endpoint xem mã test, không tốn tiền); prod dùng `HttpSmsProvider` (eSMS/SpeedSMS/
Viettel — điền key khi deploy, so giá sau). Không hard-code nhà cung cấp trong code.
