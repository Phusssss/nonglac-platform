# FSD-02: TÀI LIỆU MÔ TẢ CHỨC NĂNG CHI TIẾT (FUNCTIONAL SPECIFICATION DOCUMENT)

---

## 1. MA TRẬN PHÂN QUYỀN SỬ DỤNG (RBAC MATRIX)

| Nhóm Chức năng | SUPER_ADMIN | FARM_OWNER | FARM_MANAGER | AGRONOMIST | WORKER | BUYER (Public) |
| :--- | :---: | :---: | :---: | :---: | :---: | :---: |
| **Quản trị Hệ thống / Tenant** | **X** | - | - | - | - | - |
| **Vẽ Ranh giới Farm & Entity** | - | **X** | **X** | - | - | - |
| **Quản lý Mùa vụ & Quy trình** | - | **X** | **X** | **X** | - | - |
| **Phân công Công việc (Task)** | - | **X** | **X** | - | - | - |
| **Ghi nhận Hoạt động & Evidence** | - | - | **X** | **X** | **X** | - |
| **Xác minh / Audit Dữ liệu** | - | **X** | **X** | **X** | - | - |
| **Xem Chợ & Truy xuất nguồn gốc**| **X** | **X** | **X** | **X** | **X** | **X** |

---

## 2. PHÂN HỆ MOBILE APP (DÀNH CHO WORKER & AGRONOMIST)

* **Chức năng Đăng nhập & Offline Auth:** Xác thực JWT, lưu Offline Token an toàn trong SecureStore, cho phép duy trì phiên đăng nhập khi mất mạng.
* **Chức năng Định vị Nhanh (QR / GPS Scan):** Scan mã QR tại đầu Luống/Cây hoặc dùng GPS để tự động xác định `target_entity_id` cần thao tác.
* **Chức năng Ghi nhận Nhật ký 1-Tap:**
  * Chọn loại thao tác: Tưới nước, Bón phân, Phun thuốc, Tỉa cây, Thu hoạch.
  * Nhập số lượng vật tư / công lao động.
  * Bắt buộc chụp ảnh bằng chứng (Tự động đính kèm tọa độ GPS và Timestamp vào Metadata của ảnh).
* **Chức năng Đồng bộ Background (Offline-First Queue):** Tự động lưu bản ghi vào bộ nhớ nội cục khi mất kết nối 4G/Wifi và tự động đẩy dữ liệu lên Server khi có mạng trở lại.

---

## 3. PHÂN HỆ WEB ADMIN (DÀNH CHO OWNER & MANAGER)

* **Bản đồ Tương tác Nông trại (Digital Farm Map):**
  * Tích hợp bản đồ vệ tinh Mapbox GL / Leaflet.
  * Vẽ ranh giới Polygon cho Farm, Zone, Field, Greenhouse, Bed và định vị Point cho Plant.
  * Lớp phủ (Overlay) màu sắc phân loại trạng thái: Đang canh tác, Cần tưới, Cảnh báo sâu bệnh, Sẵn sàng thu hoạch.
* **Trình quản lý Cấu trúc Cây (Entity Tree Manager):** Cho phép thêm/sửa/xóa các cấp thực thể không giới hạn dựa trên LTREE.
* **Quản lý Mùa vụ & Vật tư:** Tạo mùa vụ (Crop Season), liên kết lô vật tư (Material Batch), tự động khấu trừ tồn kho khi Worker thực hiện công việc.
* **Audit Trail & Anomaly Detection:** Xem lại lịch sử chỉnh sửa nhật ký bất biến, nhận cảnh báo các ghi nhận bất thường (ví dụ: Tọa độ GPS công nhân quá xa vị trí thửa đất quy định).

---

## 4. PHÂN HỆ SÀN CHỢ NÔNG LẠC & TRUY XUẤT NGUỒN GỐC (MARKETPLACE & TRACEABILITY)

* **Trang Danh mục & Chi tiết Nông sản (SEO Ready):** Hiển thị danh sách nông sản theo chuẩn SSR/ISR của Next.js với tốc độ load dưới 1 giây.
* **Widget Truy xuất Nguồn gốc Canh tác (Live Traceability Widget):**
  * Hiển thị vị trí lô đất sản xuất thực tế trên bản đồ.
  * Timeline lịch sử bón phân, tưới nước, thu hoạch kèm ảnh chụp bằng chứng thực tế.
  * Hiển thị Chỉ số Tin cậy Dữ liệu (Data Confidence Level) dựa trên tỷ lệ bằng chứng số được xác minh.
