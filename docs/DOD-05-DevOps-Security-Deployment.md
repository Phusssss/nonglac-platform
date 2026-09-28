# DOD-05: TÀI LIỆU HẠ TẦNG, BẢO MẬT & TRIỂN KHAI (DEVOPS, SECURITY & DEPLOYMENT)

---

## 1. CẤU HÌNH HẠ TẦNG DOCKER COMPOSE (VPS PRODUCTION)

```yaml
version: '3.8'

services:
  postgres:
    image: postgis/postgis:16-3.4-alpine
    container_name: nonglac_db
    restart: always
    environment:
      POSTGRES_DB: nonglac_db
      POSTGRES_USER: nonglac_user
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "127.0.0.1:5432:5432"

  redis:
    image: redis:7-alpine
    container_name: nonglac_redis
    restart: always
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "127.0.0.1:6379:6379"

  emqx:
    image: emqx/emqx:5.7.0
    container_name: nonglac_mqtt
    restart: always
    ports:
      - "1883:1883"
      - "18083:18083"
    volumes:
      - emqx_data:/opt/emqx/data

volumes:
  postgres_data:
  redis_data:
  emqx_data:
```

---

## 2. QUY TRÌNH BẢO MẬT HỆ THỐNG (SECURITY HARDENING CHECKLIST)

* **Xác thực Token:** Access Token (15 phút) lưu trong bộ nhớ tạm memory + Refresh Token lưu trong HttpOnly, SameSite=Strict Cookie.
* **Rate Limiting Engine:** Sử dụng Redis Throttler chặn các cuộc tấn công Brute-force API (Tối đa 100 requests/phút/IP).
* **Bảo vệ Dữ liệu Media:** 100% link ảnh/video lưu trong Database ở dạng Private Object; chỉ truy cập được qua Signed URLs có thời hạn.
* **CORS & Security Headers:** Chỉ cho phép Domain chính thức kết nối API, tích hợp Helmet để bảo mật Header HTTP.

---

## 3. CẤU HÌNH CHUẨN SEO CHO TRANG CHỢ NÔNG LẠC

* **Dynamic JSON-LD Schema:** Mỗi sản phẩm tự động sinh mã Structured Data (`schema.org/Product`) phục vụ Google Bot Indexing.
* **Dynamic Sitemap & Robots.txt:** Tự động cập nhật `sitemap.xml` mỗi khi có nông sản hoặc trang trại mới xuất bản.
* **Tối ưu hóa Core Web Vitals:** Sử dụng `next/image` kết hợp Cloudflare R2 / GCS CDN để tự động nén ảnh về chuẩn WebP/AVIF giúp tốc độ load trang đạt dưới 1 giây.
