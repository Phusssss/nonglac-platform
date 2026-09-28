# SIMPLE-17: ĐẶC TẢ SIMPLE MODE NÔNG HỘ NHỎ (v2 — đã review)

**Nguồn**: quyết định web-first (1 app cho cả hộ nhỏ lẫn doanh nghiệp),
MOB-09/MOB-14 (logic farmer tái dùng), DASH-13/WEB-10 (bản full để rút gọn)

---

## 1. ĐIỀU KIỆN BẬT

`farms.settings.simple_mode = true` khi farm ≤ 3 user active (tự gợi ý bật lúc
tạo farm nhỏ) hoặc owner bật/tắt tay bất cứ lúc nào. Cùng DB + cùng API —
mode chỉ là feature flag phía frontend, **không migrate dữ liệu khi đổi mode**.

## 2. GỒM GÌ (3 màn, mobile-first)

- **Hôm nay**: task của mình + nút `[+ Ghi nhật ký]` lớn (luồng MOB-09 rút gọn:
  chọn việc → số lượng → chụp ảnh → lưu; ẩn chọn lô vật tư chi tiết, tự gán
  batch mặc định của mùa vụ (rule: lô mới nhất còn tồn của từng loại vật tư).
- **Lịch sử**: log của mình (ảnh + trạng thái duyệt), pull-to-refresh.
- **Tài khoản**: đổi PIN, cài PWA, chuyển full mode (owner).

## 3. ẨN GÌ (so với full mode)

- MH-07 rút còn: diện tích + tiến độ mùa vụ (ẩn sync%/coverage/biểu đồ).
- Ẩn: MH-12 chi tiết (chỉ hiện tổng chi 3 nhóm), audit stream người khác,
  sửa cây LTREE (xem bản đồ read-only), tạo mùa vụ (muốn tạo → tạm tắt simple,
  xong bật lại; audit MODE_SWITCH ghi cả 2 chiều).
- Review/duyệt chéo: hộ nhỏ tự duyệt log của mình (owner = worker) — bỏ bước duyệt,
  confidence vẫn tính đúng công thức TRACE-11.

## 4. NÂNG CẤP LÊN FULL

Tắt flag (farm lớn lên hoặc muốn đủ tính năng) → hiện toàn bộ Admin mode ngay,
dữ liệu cũ dùng tiếp. Audit ghi sự kiện `MODE_SWITCH` (ai, khi nào, chiều nào).

## 5. ACCEPTANCE

- Farm seed DL (3 user) bật simple: worker An chỉ thấy 3 màn, log 1 việc < 60s.
- Tắt flag → MH-07/11/12 hiện đủ, số liệu khớp (chung DB).
- Không có API riêng cho simple mode (verify: diff API = rỗng).
