# PWA-16: ĐẶC TẢ PWA SHELL + OFFLINE WEB (v2 — đã review)

**Nguồn**: quyết định web-first (PWA cài được, iOS quan trọng từ đầu),
SYNC-07 (hợp đồng sync giữ nguyên), AUTH-08 (token web), PLAN P3-web/P5-6

---

## 1. CÀI ĐẶT (installable)

Manifest: tên, icon 192/512 (logo Nông Lạc), `display: standalone`,
`start_url: /app`, theme `#2E7D32`. Trang nào cũng có prompt cài đặt
(trước khi đủ điều kiện trình duyệt) + hướng dẫn "Thêm vào MH chính" cho iOS.
Đã cài → mở fullscreen không thanh địa chỉ, splash theo theme.

## 2. SERVICE WORKER CACHE (3 tầng)

- **App shell** (login/tasks/log/sync + CSS/JS): cache-first, version theo build.
- **Bản đồ**: vector tile đã xem cache dần (giới hạn ~200MB, LRU); online mới tải tile mới.
- **Chợ/QR (ISR)**: stale-while-revalidate — offline đọc bản cache gần nhất
  (đúng state Offline MH-13→16). API `POST` và phán quyết audit KHÔNG cache.

## 3. OUTBOX IndexedDB (nói đúng SYNC-07, server không đổi)

Store `outbox` mirror SYNC-07 §2: `client_id, table, op=CREATE, payload,
occurred_at, retry_count, status (PENDING/UPLOADING/SYNCED/ERROR), last_error`;
ảnh gốc lưu `media_blobs` (local path → upload presigned trước, rồi thay URL
vào payload — thứ tự media-trước-JSON-sau giữ nguyên). `meta` store:
`last_pull_at`, `pending_count`.

## 4. ĐỒNG BỘ (foreground-first vì iOS)

- Android Chrome: Background Sync API khi có mạng.
- iOS + fallback chung: sync khi mở app / quay lại foreground / sự kiện `online` +
  nút `[🔄 ĐỒNG BỘ]` nổi luôn hiện số PENDING (pattern MH-05).
- Timeout không ACK → retry giữ idempotency (SYNC-07 §4). Pull gửi kèm
  `pending_count` (SYNC-07 §9).

## 5. PUSH + XÁC THỰC WEB

- Web Push cho thông báo duyệt/cảnh báo; iOS yêu cầu PWA đã cài + iOS ≥ 16.4
  (ghi rõ trong màn hướng dẫn, máy cũ hơn → chỉ báo trong app).
- Access JWT memory, refresh HttpOnly cookie (AUTH-08). PIN offline:
  hash salted trong IndexedDB (kém SecureStore native — chấp nhận v1, ghi log
  quyết định; phase RN dùng SecureStore).

## 6. CAMERA/GPS TRÌNH DUYỆT

- `<input capture="environment">` mở thẳng camera; canvas burn watermark
  `lat,lng - giờ` trước upload; GPS qua Geolocation `enableHighAccuracy` + badge ±m.
- Vì browser cho chuyển sang thư viện: server từ chối ảnh thiếu GPS EXIF
  hoặc giờ chụp lệch > 30 phút (rule mới, bổ sung SYNC-07 §5); còn lại FLAGGED
  → duyệt tay MH-11 (giữ nguyên lưới an toàn).
- In Bluetooth (MH-06) không có trên web/iOS → bản web fallback: hiện QR lớn +
  nút tải PNG để in sau; in trực tiếp dời phase RN.

## 7. ACCEPTANCE (2 máy thật: Android yếu + iPhone)

- Máy bay: login offline (PIN) → ghi log có ảnh watermark → queue PENDING →
  tắt máy bay → foreground sync → ACCEPTED, kho trừ đúng.
- iOS: không background sync nhưng mở app là sync; cài PWA ≥16.4 nhận push test.
- Gỡ mạng giữa upload: retry không trùng (idempotency), không mất ảnh.
