# TRACE-11: ĐẶC TẢ TRUY XUẤT NGUỒN GỐC MH-14/15/16 (v2 — đã review)

**GHI CHÚ SCOPE**: nút `[MUA NGAY]/[THÊM GIỎ HÀNG]` (MH-15) NGOÀI scope v1 —
6 tài liệu gốc không định nghĩa orders/thanh toán. V1: nút mở form liên hệ/đặt
trước với farm (lưu vào `reports` loại PREORDER). Muốn bán online thật → cần
spec orders riêng (quyết định chờ duyệt).

**Nguồn**: UI-06 MH-14/15/16, FSD-02 §4, WEB-10 §3 (badge), PLAN P2-14/15/16/19 + P5-2/3/4

---

## 1. CÔNG THỨC DATA-CONFIDENCE % (P2-19, chốt)

Phạm vi = activities thuộc (crop_season + entity) của lô. Gọi:
`total` = số activities; `ok` = số activities có ≥1 ảnh VÀ `verification_status=APPROVED`.
`confidence = round(100 * ok / total)`; `total=0` → `null` (hiển thị
"đang cập nhật", đúng state Error MH-15). Không bù điểm cho FLAGGED/REJECTED/thiếu ảnh.
Seed demo `BATCH-DOU-2026-882`: total=3, ok=1 (f...003) → **33%** — thấp nhưng đúng
luật; muốn demo badge xanh thì duyệt thêm evidence ở MH-11.

## 2. API LIVE TRACEABILITY (P2-15) — public read

`GET /api/v1/trace/batches/:code` (không cần login, cache 5 phút):
trả batch (mã, ngày thu hoạch/đóng gói/HSD) + farm + đường dẫn LTREE entity +
timeline activities (loại, giờ, người làm, ảnh signed URL ngắn hạn) +
certificates + confidence. Timeline chỉ chứa activity APPROVED;
PENDING/FLAGGED chưa duyệt không lộ ra ngoài (chống rò log lỗi).

## 3. QR PUBLIC + BÁO CÁO SAI PHẠM (P2-16)

`GET /api/v1/trace/qr/:code`: gọn cho MH-16 (<0.5s, cache CDN/ISR, rate limit
riêng chặt hơn vì public) — BatchSummaryCard + origin + ảnh thu hoạch + certs.
Lô có `packed_at` NULL = tem chưa kích hoạt → message Empty MH-16
("Lô hàng chưa được kích hoạt tem truy xuất!"). Mã sai → Error đỏ MH-16.
`POST /api/v1/trace/:code/reports` {tên, SĐT, nội dung} (public, captcha ở web):
→ anomaly loại COMPLAINT + báo quản lý + audit. Không cho sửa/xóa report.

## 4. CATALOG API (P2-14, cho MH-14)

`GET /api/v1/products?farm=&cert=VietGAP&min_confidence=90&price_min=&price_max=&sort=confidence_desc|price_asc|price_desc|newest`:
- `cert` lọc qua join certificates; `min_confidence` dùng công thức §1
  (product chưa gắn batch → confidence null → rớt khỏi filter >90%).
- Sort mặc định `confidence_desc` (đúng MH-14). Search text dùng index
  `idx_products_search` (gõ không dấu ra hàng có dấu, DDD-04).
- Trả kèm `harvest_batch.code` để hiện "Lô thu hoạch: #..." (frontend rút gọn
  full form `BATCH-DOU-2026-882` → `#BATCH-882`, chốt ở seed v5).

## 5. ACCEPTANCE (map seed)

- `GET /trace/batches/BATCH-DOU-2026-882` → timeline 1 dòng APPROVED (f...003 +
  ảnh), 2 certs (VG-2026-882, RL-2026-882), confidence 33%.
- MH-14 filter `VietGAP + >90%` với seed → rỗng + message Empty UI-06
  ("Không có sản phẩm nào đạt >90%") — đúng luật, không phải bug.
- Quét tem → MH-16 <0.5s (cache), gửi report → manager nhận COMPLAINT.
