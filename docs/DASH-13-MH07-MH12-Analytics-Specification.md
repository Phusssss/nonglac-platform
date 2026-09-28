# DASH-13: ĐẶC TẢ MH-07 DASHBOARD + MH-12 COSTS (v2 — đã review)

**Nguồn**: UI-06 MH-07/MH-12, PLAN P2-6/P2-13/P4-2/P4-7. Mọi con số hiển thị
phải có công thức SQL/logic chốt dưới đây — cấm số cứng frontend.

---

## 1. BỐN KPI MH-07 (theo dropdown mùa vụ đang chọn)

1. **Diện tích số**: `SUM(ST_Area(geometry::geography))` entities farm (m² → Ha) +
   đếm Zone. SQL trực tiếp, không cache.
2. **Sản lượng dự kiến**: `SUM((metadata->>'expected_yield_kg')::numeric)`
   crop_seasons kỳ đó. (DDD không có cột sản lượng → chốt đọc từ metadata,
   nhập khi tạo mùa vụ ở MH-10.)
3. **Tỷ lệ Sync**: `100*APPROVED/total` activities 30 ngày gần nhất +
   "đang đọng" = tổng `pending_count` mobile báo lên ở lần pull gần nhất
   (SYNC-07 §9 mở rộng: pull response kèm `pending_count`).
4. **Digital coverage %**: % Bed/Plant có ≥1 activity trong 30 ngày
   / tổng Bed/Plant farm.

## 2. MH-12 CHI PHÍ & DỰ BÁO

- Nguồn giá (chốt): vật tư = `SUM(USE.qty × material_batches.unit_price)`;
  nhân công = giờ công (tasks DONE: `updated_at - created_at`) ×
  `farms.metadata->>'hourly_rate'` (nhập 1 lần/farm, vd 25000đ/giờ);
  vận hành = bảng `operational_costs` (điện/nước/xăng — nhập tay MH-12,
  đã thêm vào 02-supplement.sql).
- Biểu đồ cột chồng theo tháng (vật tư/nhân công/vận hành); tooltip chi tiết
  từng mã vật tư (drill từ material_batches).
- Chi phí/kg = tổng chi phí mùa vụ / `SUM(harvest_batches.quantity)` (MH-12:
  Hana 42.500đ/kg...); chi phí/m² tương tự trên diện tích.
- Dự báo lợi nhuận = doanh thu dự kiến (giá TB `products` cùng crop ×
  `expected_yield_kg`) − tổng chi phí. Ghi rõ "dự báo" + ngày tính.

## 3. ACCEPTANCE (map seed)

- MH-07 farm DL: diện tích = area polygon Zone A (tính thật); coverage =
  Bed có log/2 (f...002 B02 + f...003 B01 → 100% nếu trong 30 ngày).
- MH-12: NPK 125.5kg × 12.000đ = 1.506.000đ hiện ở miếng vật tư;
  chi phí/kg = tổng chi / 120kg lô 882.
