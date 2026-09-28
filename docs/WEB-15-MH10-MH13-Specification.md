# WEB-15: ĐẶC TẢ MH-10 MÙA VỤ/KHO + MH-13 CHỢ HOME (v2 — đã review)

**Nguồn**: UI-06 MH-10/MH-13, PLAN P2-6/P4-5/P5-1. Backend đã chốt
(P2-6 seasons, P2-7 kho, DASH-13 công thức) — file này chỉ chốt hành vi UI.

---

## 1. MH-10 MÙA VỤ & ĐỐI SOÁT KHO

- Nút `[+ Tạo Mùa Vụ Mới]` → modal: tên, giống, entity (chọn từ cây MH-09),
  ngày bắt đầu/dự kiến + `expected_yield_kg` + `norms` (DASH-13) trong metadata
  + multi-select lô vật tư dùng cho mùa vụ (FSD-02: liên kết lô vật tư,
  lưu `metadata.linked_material_batch_ids`). Quyền OWNER/MANAGER/AGRONOMIST.
- SeasonProgressCard: % = (today − start)/(expected − start), kẹp 0–100 +
  nhãn giai đoạn (gieo/mọc/đậu quả/thu hoạch — theo % cố định 25/50/75%).
- Bảng đối soát (antd Table): Tên | Tồn đầu (`initial_qty`) | Khấu trừ
  (`SUM USE` kỳ mùa vụ) | Tồn tại. Click số khấu trừ → popup danh sách
  activities (người, giờ, số lượng, link evidence). Dòng tồn âm → viền đỏ +
  message Error UI-06 ("kiểm tra nhật ký nhập kho").
- Empty: chưa mùa vụ → CTA tạo (đúng UI-06). Web Admin không hỗ trợ offline
  cập nhật kho (đúng spec: banner yêu cầu mạng).

## 2. MH-13 CHỢ HOME (SSR, target <1s)

- Header: logo + SearchBarFullText (gợi ý không dấu/có dấu, API P2-14) + giỏ hàng
  (v1: giỏ = danh sách đặt trước local, TRACE-11 scope note).
- Hero banner trượt (chứng nhận Digital Twin), click → MH-14 lọc theo farm +
  grid sản phẩm `is_published`: ảnh, tên, giá, **Live Trace badge %**.
- Enter tìm kiếm → MH-14 giữ query; click card → MH-15.
- Skeleton 6 ô; lỗi API → Error + retry; không kết quả → Empty; offline →
  trang ISR cache (Next Service Worker).
