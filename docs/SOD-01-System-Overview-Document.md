# SOD-01: TÀI LIỆU TỔNG QUAN HỆ THỐNG (SYSTEM OVERVIEW DOCUMENT)

---

## 1. TẦM NHÌN & MỤC TIÊU DỰ ÁN

* **Mục tiêu cốt lõi:** Nông Lạc được xây dựng thành một **Digital Farm Platform** nhằm tạo ra một "bản sao số" (Digital Twin) hoàn chỉnh của nông trại thực tế.
* **Định hướng công nghệ:** Số hóa toàn bộ cấu trúc, hoạt động, dữ liệu canh tác và lịch sử sản xuất từ cấp độ tổng quan đến từng cây trồng thực tế.
* **Sàn Chợ Nông Lạc (Marketplace):** Kết nối trực tiếp sản phẩm từ nông trại đến người tiêu dùng với dữ liệu canh tác đã được kiểm chứng minh bạch và đầy đủ tính truy xuất nguồn gốc.

---

## 2. TRIẾT LÝ THIẾT KẾ 5 NGUYÊN TẮC

1. **Location First:** Mọi dữ liệu phải gắn liền với vị trí địa lý hoặc thực thể nông trại phân cấp cụ thể (`Farm` -> `Zone` -> `Field` -> `Bed` -> `Row` -> `Plant`).
2. **Event First:** Mọi hoạt động canh tác đều là một biến cố (Event) được ghi nhận theo thời gian thực (Ai - Làm gì - Ở đâu - Khi nào - Bao nhiêu).
3. **Evidence First:** Dữ liệu có giá trị khi đi kèm bằng chứng số đầy đủ (GPS, Ảnh chụp, Video, Mã vật tư/Batch ID).
4. **Automation First:** Tối đa hóa khả năng ghi nhận tự động từ các thiết bị IoT và ứng dụng di động để giảm thiểu thao tác nhập liệu thủ công cho công nhân.
5. **Human Friendly:** Giao diện ứng dụng đơn giản, trực quan, tối ưu hóa thao tác chạm/nói (Voice-to-Text) dành cho người nông dân ngoài đồng ruộng.

---

## 3. MA TRẬN THAM CHIẾU & LIÊN KẾT BỘ TÀI LIỆU (DOCUMENT TRACEABILITY MATRIX)

| Mã Tài liệu | Tên Tài liệu | Đầu vào / Phụ thuộc | Đầu ra / Bàn giao | Liên kết đến Tài liệu khác |
| :--- | :--- | :--- | :--- | :--- |
| **SOD-01** | **Tài liệu Tổng quan** | Master Plan Nông Lạc | Định hướng & Quy chuẩn chung | Định hướng cho tất cả các Tài liệu kỹ thuật |
| **FSD-02** | **Mô tả Chức năng** | Yêu cầu Nghiệp vụ SOD-01 | Use-case & Danh sách Màn hình | Liên kết API trong **SAD-03**, Schema trong **DDD-04** |
| **SAD-03** | **Kiến trúc Hệ thống** | Yêu cầu FSD-02 | Cấu trúc BE, FE, Storage & Sync Engine | Hiện thực hóa Data Flow trong **DDD-04** & **DOD-05** |
| **DDD-04** | **Thiết kế Database** | Luồng dữ liệu SAD-03 | DDL SQL Schema (PostgreSQL/LTREE/PostGIS) | Cung cấp Data Model cho **FSD-02** & **SAD-03** |
| **DOD-05** | **Hạ tầng & Triển khai** | Yêu cầu Security & Performance | Docker Compose, CI/CD, SEO Config | Vận hành hệ thống được mô tả ở **SAD-03** & **DDD-04** |
