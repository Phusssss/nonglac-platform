# WEB-10: ĐẶC TẢ MH-11 AUDIT & EVIDENCE (v2 — đã review, khớp MH-11/MH-07)

**Nguồn**: UI-06 MH-11 + MH-07 (anomaly panel), SYNC-07 §5 (policy FLAGGED),
AUTH-08 §4 (quyền duyệt), PLAN P2-10/P2-11/P2-12/P4-6
**Wireframe**: xem UI-06 §MH-11 (giữ nguyên, file này chốt logic + rules).

---

## 1. AUDIT STREAM (bảng giám sát)

Cột: thời gian | vị trí (tên + mã LTREE) | hoạt động | người thực hiện |
bằng chứng (`[XEM ẢNH]` / `[THIẾU]` đỏ) | badge tin cậy.
Implement bằng antd Table (sort/filter/phân trang server) theo P0-4.
Realtime auto-refresh qua WebSocket (P2-11); phân trang server 50 dòng.
Filter đủ 4 tiêu chí (P2-11 đã vá): nông dân, ngày thực hiện (range),
loại HĐ, trạng thái bằng chứng (PENDING/ APPROVED/FLAGGED/REJECTED/missing).

## 2. EVIDENCE MODAL (`[XEM ẢNH]` → mở)

- Trái: ảnh/video gốc (signed URL, hết hạn ngắn) + watermark đọc từ EXIF.
- Phải — bảng đối soát (đúng UI-06):
  GPS ảnh | GPS thực thể (center `geometry`) | độ lệch `ST_Distance` (m) |
  phán quyết: ≤10m 🟢 HỢP LỆ, >10m 🔴 VI PHẠM + mạng đẩy (đọc từ
  `activity_evidence.device_info`, vd "4G Viettel").
- Nút `[DUYỆT BẢN GHI]` / `[CẢNH BÁO]` (antd Button large) + ô lý do bắt buộc
  khi CẢNH BÁO; modal = antd Modal + Descriptions cho bảng đối soát.
  Quyền: OWNER/MANAGER/AGRONOMIST (WORKER chỉ xem log của mình).
  Mỗi quyết định → `audit_logs` (người duyệt, cũ/mới, lý do) + cập nhật
  `verification_status` + đẩy thông báo về app công nhân.

## 3. BADGE TIN CẬY (DataConfidenceBadge, theo dòng)

- 🟢 Cao: có ảnh + GPS ≤10m + APPROVED.
- 🟡 Trung bình: PENDING hoặc video/QR thiếu GPS.
- 🔴 Cảnh báo: FLAGGED (GPS xa) hoặc thiếu ảnh (`[THIẾU]`) hoặc REJECTED.
Badge dòng = input cho confidence % cấp batch (P2-19).

## 4. ANOMALY ENGINE (rules tự động, P2-12 → panel MH-07)

| Rule | Điều kiện | Đích |
|---|---|---|
| GPS_FAR | lệch > 10m | anomaly + FLAGGED (SYNC-07 §5) |
| MISSING_EVIDENCE | activity > 24h không ảnh | anomaly + badge 🔴 |
| OVER_NORM | lượng bón / ha > định mức mùa vụ | anomaly + yêu cầu duyệt |

Định mức (`OVER_NORM`): cấu hình trong `crop_seasons.metadata.norms`
(vd: `{NPK_max_kg_per_ha: 300}`); mùa nào không cấu hình → rule tắt (không đoán mò).
Panel MH-07 đọc chung nguồn anomaly, click → sang MH-11 đã filter sẵn.

## 5. STATES MÀN HÌNH (thuộc DoD P4-8)

Loading: spinner từng dòng đang xác thực. Error: "Không thể kết nối đối soát GPS!".
Empty: "Không có nhật ký trùng bộ lọc!". Offline: banner yêu cầu mạng (đối soát
GPS bắt buộc server, không cache phán quyết).

## 6. ACCEPTANCE

- Seed demo: activity f...002 (không ảnh) hiện `[THIẾU]` + badge 🔴 + anomaly
  MISSING_EVIDENCE; evidence f...011 (lệch 0m) hiện 🟢.
- Quy trình duyệt < 3 click: mở modal → DUYỆT/CẢNH BÁO → stream tự refresh qua WS.
- Mọi quyết định có audit đủ người/lý do; WORKER gọi duyệt → 403 + audit.
