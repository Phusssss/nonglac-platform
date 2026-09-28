# MOB-14: ĐẶC TẢ MOBILE MH-01/02/03/05/06 + LOCAL SCHEMA (v2 — đã review)

**Nguồn**: UI-06 MH-01/02/03/05/06, AUTH-08 (login/offline), SYNC-07 (outbox/push/pull),
MOB-09 (MH-04), PLAN P3-1/2/3/4/6/7. MH-04 đã chốt riêng ở MOB-09.

---

## 1. LOCAL SCHEMA (WatermelonDB, mirror server + cột sync)

`users_me, farms, entities(id, path, geometry_wkt, parent), crop_seasons,
tasks(+sync_status), materials, material_batches(current_qty),
activities_local(server_id NULL⇄UUID, sync_status), evidence_local(file_path),
harvest_batches, sync_outbox (SYNC-07 §2), meta(kv: last_pull_at, server_time_skew)`.
Master pull (SYNC-07 §9) upsert đè local, trừ outbox PENDING.

## 2. MH-01 LOGIN (logic AUTH-08 §1, UI đủ 4 states)

Online: SĐT (validate VN) + PIN → `POST /auth/login` → access memory +
refresh + PIN-hash vào SecureStore + checkbox offline. Sai → lỗi đỏ;
không mạng → lỗi + sáng nút offline. Badge "N nhật ký offline" = đếm outbox PENDING.

## 3. MH-02 TASKS (data P2-18, đã pull)

3 KPI: TODO/IN_PROGRESS = cần làm; DONE hôm nay = đã xong; outbox PENDING = chờ sync.
Filter Zone/Field (lọc theo path prefix entity). Card task có tag màu ưu tiên
(đỏ HIGH / vàng MEDIUM / xanh LOW). Tap task → MH-04 prefill
(type+entity+task_id). FAB → MH-03. Pull-to-refresh → pull + báo pending_count (§SYNC-07 §9).
Skeleton loading; lỗi mạng → banner "đang hiện dữ liệu offline gần nhất".

## 4. MH-03 SCAN (khóa location cho MH-04)

Camera QR (chuỗi mã entity, offline decode tra local) + GPS live (±m badge, flash).
So mã QR ↔ GPS: lệch > 50m → cảnh báo đỏ (ngưỡng scan thoáng hơn ngưỡng duyệt 10m
server — scan chỉ để chọn đúng luống, duyệt mới cần chính xác).
Thẻ kết quả hiện tên + mã LTREE + tọa độ, có 2 nút `[Ghi nhật ký]` (→ MH-04)
và `[Xem hồ sơ cây]` (→ MH-06, nếu là Plant). `[XÁC NHẬN]` khóa entity.
Rung + "Bíp" khi quét trúng.

## 5. MH-05 QUEUE (hiển thị outbox, chạy SYNC-07 §1)

Item: icon loại HĐ + entity + giờ + thumbnail ảnh local + dung lượng (MB) + trạng thái
(đang tải/chờ/lỗi + `[Thử lại]`). Nút sync-all disable khi offline.
Thứ tự: upload media → push → ACK → SYNCED (đúng SYNC-07); item REJECT-validation →
ERROR cho sửa/chụp lại (đúng UI-06 flow). Background auto-sync khi có mạng.

## 6. MH-06 PLANT PASSPORT (read-only + in QR)

Quét QR Plant → timeline activities của entity type=PLANT (mới nhất trước) +
header (giống, ngày trồng, tuổi = today − season.start, tọa độ) + mini-map 1 điểm
gốc cây + nút in QR qua Bluetooth (máy in nhiệt, template mã + tên). Offline: đọc cache đã pull.
Cây mới (chưa log) → Empty "chưa có nhật ký".

## 7. ACCEPTANCE (offline toàn trình, máy bay)

Quay video test: bật máy bay → login offline (PIN cache) → MH-02 thấy 3 tasks seed →
FAB quét (giả QR B02) → MH-04 lưu PENDING → MH-05 thấy 1 item → tắt máy bay →
tự sync → MH-02 badge 0, server có log, kho NPK trừ đúng.
