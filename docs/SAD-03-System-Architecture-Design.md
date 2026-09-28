# SAD-03: TÀI LIỆU THIẾT KẾ KIẾN TRÚC HỆ THỐNG (SYSTEM ARCHITECTURE DESIGN)

---

## 1. SƠ ĐỒ KIẾN TRÚC THÀNH PHẦN (COMPONENT ARCHITECTURE)

```text
[ MOBILE APP (React Native) ]          [ WEB ADMIN / CHỢ (Next.js 14) ]
  (WatermelonDB / Offline)                 (Mapbox GL / SEO ISR)
            │                                         │
            └────────────────────┬────────────────────┘
                                 │ HTTPS / WebSockets
                                 ▼
                    [ REVERSE PROXY: NGINX / COOLIFY ]
                                 │
                                 ▼
                    [ BACKEND API: NESTJS FRAMEWORK ]
            ┌────────────────────┼────────────────────┐
            │                    │                    │
            ▼                    ▼                    ▼
   [ PostgreSQL 16 ]     [ REDIS CACHE/QUEUE ]   [ EMQX MQTT BROKER ]
   ├── PostGIS (Maps)    ├── Session / Cache     └── (Khung chờ IoT Engine)
   ├── LTREE (Tree)      └── BullMQ (Sync Queue)
   └── Unaccent (SEO)
            │
            ▼
   [ OBJECT STORAGE ]
   ├── Google Cloud Storage (Ảnh Evidence)
   └── Cloudflare R2 (Video Bằng chứng - $0 Egress)
```

---

## 2. THIẾT KẾ LUỒNG ĐỒNG BỘ OFFLINE-FIRST (SYNC ENGINE DESIGN)

```text
Client (Mobile App)               API Gateway (NestJS)             Database (PostgreSQL)
        │                                 │                                 │
 [Tạo Activity Local]                     │                                 │
 (Status: PENDING)                        │                                 │
        │                                 │                                 │
 [Có kết nối Internet]                    │                                 │
        ├─ 1. POST /api/v1/sync/push ────►│                                 │
        │    (Batch Payload + Local IDs)  │                                 │
        │                                 ├─ 2. Validate & Verify GPS ─────►│
        │                                 ├─ 3. Execute DB Transaction ────►│
        │                                 │    (Insert Activity & Evidence) │
        │                                 │◄─ 4. Transaction Committed ─────┤
        │◄─ 5. Return ACK (Mapped IDs) ───┤                                 │
        │                                 │                                 │
 [Update Local Status]                    │                                 │
 (Status: SYNCED)                         │                                 │
```

---

## 3. THIẾT KẾ LUỒNG UPLOAD MEDIA TRỰC TIẾP (DIRECT STORAGE UPLOAD)

1. **Khởi tạo:** Mobile App gọi API `POST /api/v1/storage/presigned-url` truyền tham số `fileName`, `fileType` và `fileSize`.
2. **Cấp quyền:** NestJS Backend kiểm tra quyền hạn user, tạo **Presigned Upload URL** có thời hạn 15 phút từ **Google Cloud Storage** (đối với Ảnh) hoặc **Cloudflare R2** (đối với Video).
3. **Upload nhị phân:** Client thực hiện lệnh PUT dữ liệu nhị phân trực tiếp lên Cloud Storage (không qua VPS backend).
4. **Xác nhận:** Client gửi Payload chứa URL chính thức về NestJS để lưu bản ghi vào bảng `activity_evidence` trong Database.

---

## 4. KHUNG THIẾT KẾ KHẢ NĂNG MỞ RỘNG IOT (IOT ENGINE PREPAREDNESS)

* **Message Broker:** Dựng sẵn EMQX MQTT Broker trên VPS dưới dạng Docker container.
* **Time-series Database Layer:** Dựng sẵn Extension TimescaleDB tích hợp trong PostgreSQL để sẵn sàng nhận và nén dữ liệu Sensor (`soil_moisture`, `air_temp`, `EC`, `pH`) khi kích hoạt Phase IoT.
