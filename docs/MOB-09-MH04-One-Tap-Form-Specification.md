# MOB-09: ĐẶC TẢ FORM 1-TAP MH-04 (v2 — đã review, khớp MH-04 + SYNC-07)

**Nguồn**: UI-06 MH-04 + MH-02/MH-03 (đầu vào), SYNC-07 §2/§3 (đầu ra), SOD-01
(Location/Event/Evidence/Human Friendly), PLAN P3-5
**Wireframe**: xem UI-06 §MH-04 (giữ nguyên layout ASCII, file này chỉ chốt logic).

---

## 1. ĐẦU VÀO (location đã khóa)

- Từ MH-03 `[XÁC NHẬN VỊ TRÍ]` → `target_entity_id` + tên hiển thị
  ("Luống 05 - Thửa 02"), banner "Đã khóa". Muốn đổi → quay lại MH-03.
- Từ MH-02 chạm task → prefill thêm `type` + `task_id` (link để DONE task khi sync).
- Không có location → không vào được MH-04 (redirect MH-03).

## 2. MỤC 1 — GRID 6 LOẠI HOẠT ĐỘNG (1-Tap, single-select)

| Nút | Enum server |
|---|---|
| 💧 Tưới | IRRIGATION |
| 🌱 Bón phân | FERTILIZATION |
| 💊 Thuốc | PESTICIDE |
| ✂️ Tỉa cây | PRUNING |
| 🌾 Thu hoạch | HARVEST |
| ❓ Khác | INSPECTION + bắt buộc Ghi chú |

Chưa chọn → ẩn mục 2 (đúng state Empty UI-06). Đổi loại → reset mục 2/3 đã nhập.

## 3. MỤC 2 — VẬT TƯ & SỐ LƯỢNG

- Dropdown loạt vật tư: `GET /material-batches` (cache local cho offline),
  hiển thị `Tên + tồn local`. Ẩn với HARVEST/PRUNING (không tốn vật tư).
- Số lượng: numpad lớn + đơn vị tự động từ `materials.unit` (kg/lít/bao/cuộn).
- Validate: qty > 0 (block); qty > tồn local → **cảnh báo, không block**
  (tồn offline có thể cũ; server chốt ở sync — đúng offline-first).
- Thu hoạch: thay dropdown bằng ô `số kg thu`; hệ thống TỰ GÁN lô thu hoạch đang mở
  của entity/mùa vụ (không thêm UI chọn lô — UI-06 MH-04 không có field này).

## 4. MỤC 3 — BẰNG CHỨNG (Evidence First)

- Chụp TRỰC TIẾP từ app, **cấm chọn gallery** (chống gian lận).
- Bắt buộc ≥ 1 ảnh; thiếu → viền đỏ + block lưu (đúng state Error UI-06).
- Mỗi ảnh: burn watermark `lat,lng - yyyy-MM-dd HH:mm` lên góc ảnh + giữ EXIF GPS.
  Hiện badge độ chính xác GPS (±m); > 20m → cảnh báo vàng nhưng vẫn cho chụp.
- Video tùy chọn, tối đa 60s / 100MB (quá → báo + giữ lại ảnh).
- Nút mic voice-to-text (Human Friendly, SOD-01); toàn form dùng component antd
  size large (Button Select InputNumber Upload) theo P0-4; numpad tự làm bằng
  Button large (không thêm antd-mobile).

## 5. LƯU (online/offline chung 1 nút)

Nhãn nút theo mạng: `[💾 LƯU NHẬT KÝ]` / `[💾 LƯU NHẬT KÝ (OFFLINE)]`.
Nhấn → disable chống tap 2 lần → hiện spinner (đang nén ảnh + burn watermark) →
validate → insert local 1 transaction:
`cultivation_activities` (status PENDING) + `activity_evidence` (path file local)
+ `sync_outbox` → rung + tiếng xác nhận → toast "Đã lưu vào hàng đợi đồng bộ!" → về MH-02.
`farm_id` suy từ farm của entity đã khóa (form không nhập).
Mapping field → payload `POST /sync/push` theo đúng SYNC-07 §3
(`material_batch_id`, evidence `gps_location`, `occurred_at` = giờ bấm lưu).

## 6. MA TRẬN VALIDATE (implement bằng antd Form, rules theo bảng dưới)

| Field | Rule | Lỗi |
|---|---|---|
| type | bắt buộc chọn 1 | (ẩn mục 2 cho tới khi chọn) |
| material_batch | bắt buộc nếu loại tốn vật tư | "Chọn loạt vật tư!" |
| quantity | > 0; vượt tồn → warn | "Số lượng phải > 0!" / "Vượt tồn local (x), server sẽ chốt!" |
| photo | ≥ 1 ảnh trực tiếp | viền đỏ "Chụp ít nhất 1 ảnh thực tế!" |
| video | ≤ 60s/100MB | "Video quá lớn, chỉ giữ ảnh!" |
| notes | bắt buộc nếu type=Khác | "Mô tả công việc 'Khác'!" |

## 7. ACCEPTANCE

- Mất mạng toàn trình: mở form → chụp ảnh (watermark đủ GPS/giờ) → lưu PENDING →
  có mạng tự sync (P3-6) → server ACCEPTED, kho trừ đúng (SYNC-07 test).
- Đủ 4 states UI-06; thao tác 1 tay ngoài nắng: nút ≥ 56px, chữ ≥ 16sp (P0-4).
- Không có đường nào lưu được log thiếu ảnh hoặc thiếu location.
