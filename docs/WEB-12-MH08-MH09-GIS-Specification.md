# WEB-12: ĐẶC TẢ GIS MH-08 + MH-09 (v2 — đã review, khớp MH-08/09)

**Nguồn**: UI-06 MH-08/MH-09, DDD-04 (`entities` LTREE + PostGIS), PLAN P2-4/P2-5/P4-3/P4-4

---

## 1. MH-08 BẢN ĐỒ SỐ (Mapbox GL, satellite style, token qua env)

- `GET /api/v1/entities/geojson?farm_id=` → FeatureCollection (id, code, path,
  type, status màu, area_m2 tính bằng `ST_Area(geography)`).
- DrawingToolbar: vẽ/sửa/xóa polygon (Zone/Field/Greenhouse/Block/Bed) và point
  (Plant). Lưu → PostGIS `geometry` + tự tính diện tích m² hiện ngay (đúng flow UI-06).
  Xóa node có con → popup cảnh báo cascade, ghi audit.
- Lớp phủ bật/tắt: sức khỏe cây, trạng thái canh tác, vị trí công nhân realtime.
- Click polygon → panel trượt: nhật ký gần nhất + ảnh evidence + nút `[Báo cáo xử lý]`
  (tạo task PESTICIDE cho entity đó, gán AGRONOMIST).
- Góc bản đồ hiện tọa độ con trỏ; lỗi Mapbox key → message Error UI-06;
  farm chưa có boundary → zoom toàn quốc + CTA vẽ polygon đầu tiên (Empty UI-06);
  offline → vector tile đã cache.
- Vị trí worker realtime: mobile gửi heartbeat GPS 60s/lần khi online
  (`POST /api/v1/workforce/location`) → WS broadcast → marker `📍` trên bản đồ.
  Offline: marker xám + giờ cuối thấy.

## 2. MÀU TRẠNG THÁI (quy tắc derive, chốt)

Thứ tự ưu tiên: 🔴 sâu bệnh (anomaly OPEN trên entity) > 🟡 cần tưới
(task IRRIGATION TODO quá hạn) > 🟢 sẵn sàng thu hoạch (season cách
`expected_harvest_date` ≤ 14 ngày) > mặc định đang canh tác.
Màu tính ở backend (field `status` trong GeoJSON), frontend chỉ render.

## 3. MH-09 CÂY THỰC THỂ

- Search full-text (tên/mã/path) + nút [+ Thêm Mới] (tạo node con đúng type cho phép).
- Cột phải: tên, path LTREE, cấp, diện tích, tọa độ center (`ST_Centroid`),
  số con trực tiếp + nút sửa/xóa.
- Drag-drop (vd Bed B01 F01→F02): gọi `PATCH /entities/:id/move {new_parent_id}` —
  server rewrite `path` cả subtree + `parent_id` trong 1 transaction (P2-5);
  trùng path → 409 + message Error UI-06 ("mã LTREE trùng lặp").
- Type con hợp lệ: Farm>Zone>Field/Greenhouse>Block>Bed>Row>Plant
  (STORAGE/PROCESSING_AREA treo trực tiếp dưới Farm/Zone); sai → 422.

## 4. ACCEPTANCE (map seed)

- Mở MH-08: thấy polygon Field 01/02 + point B01/B02 đúng Đà Lạt; với seed hiện tại
  B02 màu xanh (đang canh tác — không anomaly, không tưới quá hạn, mùa còn xa).
  Muốn demo 🟡/🔴: tạo task IRRIGATION quá hạn / anomaly GPS_FAR rồi reload.
- Vẽ polygon Bed mới → diện tích m² hiện ngay → reload vẫn còn (PostGIS).
- Kéo B01 sang F02 → path thành `DL.ZA.F02.B01`, cây + bản đồ refresh, audit có log.
- Tắt mạng → bản đồ cache + banner, filter cây đọc local.
