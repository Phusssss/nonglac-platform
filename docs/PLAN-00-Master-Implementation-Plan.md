# PLAN-00: KẾ HOẠCH TRIỂN KHAI CHI TIẾT (MASTER IMPLEMENTATION PLAN) — v2

**Dự án**: Nông Lạc Digital Farm Platform
**Nguồn**: SOD-01, FSD-02, SAD-03, DDD-04, DOD-05, UI-06
**Trạng thái**: v20 — OTP kích hoạt + quên PIN (AUTH-08 §7, migration 04-otp.sql đã apply live)

**Kết quả review v1 → v2:**
- [FIXED-F1] DDD-04 KHÔNG có bảng tasks nhưng FSD-02 (phân công công việc) + MH-02 (task list) bắt buộc → thêm P1-6 + P2-18.
- [FIXED-F2] DDD-04 KHÔNG có bảng kho nhưng MH-04 (dropdown loạt vật tư) + MH-10 (đối soát tồn) + P2-7 (trừ kho) bắt buộc → thêm bảng `materials`/`material_batches`/`inventory_transactions` vào P1-6.
- [FIXED-F3] DDD-04 KHÔNG có lô thu hoạch nhưng MH-14/15/16 (`#BATCH-882`, VietGAP `VG-2026-882`, HSD) bắt buộc → thêm `harvest_batches` + `certificates` vào P1-6.
- [FIXED-F4] P2-13 chi phí thiếu nguồn giá → chốt: derive từ giá nhập `material_batches` + công từ `tasks`/`activities`, chưa tạo bảng cost riêng.
- [FIXED-F5] Thiếu design system UI-06 §6 → thêm P0-4.
- [FIXED-F6] Mỗi MH phải đủ 4 states (Loading/Error/Empty/Offline) → thêm vào DoD Phase 3/4/5.
- [FIXED-F7] SAD-03 nêu BullMQ sync queue nhưng chưa có task → thêm P2-20 worker.
- [v3] Review DDL P1-6 vs field UI: MH-02 (ưu tiên/due_at/DONE) ✓, MH-04 (unit tự động kg/lít/bao) ✓,
  MH-10 (tồn đầu − khấu trừ = tồn hiện tại, popup log qua activity_id) ✓, MH-16 (ngày đóng gói/HSD DATE) ✓;
  fix nhỏ `harvest_batches.unit` → VARCHAR(50) đồng bộ `products.unit`. DDL chốt tại `infra/postgres/02-supplement.sql`.
- [v4] Review SYNC-07 vs SAD-03/MH-05/MH-11/DOD-05: chốt ACK ĐỒNG BỘ (chờ worker ≤30s,
  timeout trả JOB_PENDING + retry), presigned URL 15p hết hạn phải xin lại,
  batch 50 items để không vượt rate limit; vá PLAN P2-11 thiếu filter "ngày thực hiện"
  so với AuditFilterBar MH-11.
- [v5] Review seed P1-4: bắt bug FK (transactions insert trước activities → vỡ DB mới,
  đã đảo thứ tự + verify bằng script); chốt mã lô full form (UI-06 viết 2 dạng);
  f...002 cố ý thiếu evidence để demo cảnh báo MH-11. Seed chốt tại
  `infra/postgres/03-seed.sql` (13 INSERT, UUID cố định, idempotent).
- [v6] Review AUTH-08 vs FSD-02/MH-01/DOD-05: đủ 7 dòng ma trận → 8 rule triển khai
  (WORKER được đọc việc của mình cho MH-02); offline mode check PIN bằng hash cache
  trong SecureStore; chốt thêm khóa login 5 sai/15p (PIN yếu, ngoài DOD-05);
  refresh rotation + phát hiện reuse; WS dùng chung access JWT.
- [v7] Review MOB-09 vs MH-04/SYNC-07/SOD: thêm spinner nén ảnh, rung + tiếng xác nhận
  (đúng flow UI-06), `farm_id` suy từ entity khóa, thu hoạch TỰ GÁN lô đang mở
  (không thêm UI ngoài spec); giữ quyết định warn-không-block khi vượt tồn offline.
- [v8] Review WEB-10 vs MH-11/MH-07/SYNC-07: badge 3 mức là input confidence batch;
  định mức OVER_NORM lấy từ `crop_seasons.metadata.norms`, thiếu → tắt rule;
  "mạng đẩy" đọc từ `device_info`; bổ sung 4 states MH-11 (đối soát GPS bắt buộc online).
- [v9] Review TRACE-11 vs MH-14/15/16 + FSD-02 §4: công thức confidence chốt
  (APPROVED có ảnh / tổng, null khi chưa có log); timeline public ẩn PENDING/FLAGGED;
  thêm filter khoảng giá (đúng FilterSidebar), rule tem chưa kích hoạt
  (`packed_at` NULL); phát hiện scope mới: giỏ hàng/thanh toán KHÔNG có trong
  6 tài liệu → v1 chỉ làm form đặt trước, cần spec orders riêng nếu bán online thật.
- [v10] Review WEB-12 vs MH-08/09: sửa màu demo B02 (xanh theo đúng rule, không đoán);
  thêm Empty state (farm chưa boundary) + API heartbeat `POST /workforce/location`
  (P2-4) cho layer worker realtime; quy tắc type-con hợp lệ + màu derive 4 mức.
- [v11] Review DASH-13 vs MH-07/12: chốt 4 công thức KPI (sản lượng từ
  `crop_seasons.metadata.expected_yield_kg`, sync% + pending từ pull heartbeat,
  coverage Bed/Plant có log 30d); chi phí 3 nguồn (vật tư × giá nhập, công ×
  `farms.metadata.hourly_rate`, bảng mới `operational_costs` + seed điện/xăng);
  SYNC-07 §9 bổ sung `pending_count`.
- [v12] Review MOB-14 vs MH-01/02/03/05/06: thêm tag màu ưu tiên MH-02, thẻ kết quả
  MH-03 hiện mã LTREE + 2 nút đi MH-04/MH-06, thumbnail queue MH-05, mini-map MH-06;
  ngưỡng scan 50m (thoáng hơn ngưỡng duyệt server 10m).
- [v13] Review WEB-15 vs MH-10/13 + FSD-02: modal mùa vụ thêm multi-select lô vật tư
  (liên kết lô vật tư FSD-02, lưu metadata) + giai đoạn theo % (75% = đậu quả đúng VD);
  banner MH-13 click → MH-14 lọc farm.
- [v14 AUDIT TỔNG] Quét toàn docs (trừ UI-06 gốc): đủ MH-01→MH-16, không màn hình
  mồ côi; ma trận RBAC 7 dòng, rate limit/signed URL/CORS/Helmet, JSON-LD/sitemap,
  BullMQ/EMQX/TimescaleDB, presigned/FLAGGED/confidence/heartbeat đều có chủ.
  Quyết định chờ bạn duyệt: (1) bán online thật cần spec orders riêng (TRACE-11);
  (2) khóa login 5 sai/15p (AUTH-08); (3) ngưỡng GPS scan 50m / duyệt 10m.
- [v15 WEB-FIRST] Đổi chiến lược theo quyết định: 1 Next.js app responsive
  (Farmer/Admin/Simple 3 mode) lên trước, RN dời phase sau. PWA-16 chốt:
  manifest cài đặt, SW 3 tầng cache, IndexedDB outbox đúng hợp đồng SYNC-07
  (server không đổi), foreground-sync + nút sync (iOS không background sync),
  Web Push (iOS ≥16.4 đã cài), PIN offline = hash IndexedDB (kém SecureStore, v1
  chấp nhận), rule mới `EXIF_INVALID` chống ảnh thư viện (SYNC-07 §5),
  in Bluetooth fallback PNG. Logic MOB-09/MOB-14 tái dùng cho bản web.
- [v16] SIMPLE-17: flag `farms.settings.simple_mode` (farm ≤3 user hoặc bật tay),
  3 màn (Hôm nay / Lịch sử / Tài khoản), batch mặc định = lô mới nhất còn tồn,
  tự duyệt (owner = worker), ẩn analytics/audit-người-khác/sửa-cây/tạo-mùa-vụ;
  nâng cấp không migrate (chung DB/API, verify diff API rỗng).
- [v17] Sắp lại Phase theo web-first: Phase 3 mới = WEB FARMER + PWA + SIMPLE
  (W3-1→W3-7); RN cũ dời → Phase 7 sau MVP (giữ ID P3-x, bổ sung SecureStore +
  Bluetooth);   MVP viết lại 1 app web duy nhất; risks cập nhật (gallery-bypass,
  iOS bg sync, giữ GPS/Mapbox, RN dời không chặn).
- [v18] Chốt Ant Design cho web (thay Shadcn): ConfigProvider khóa primary
  `#2E7D32`/large/Be Vietnam Pro/viVN + AntdRegistry + import modular +
  lazy-load cụm nặng; Tailwind giữ layout; RN Paper giữ cho Phase 7.
  Specs ghi nhận: MOB-09 (Form + Button large, numpad tự làm), WEB-10
  (Table/Modal), WEB-15 (Table).
- [v19 INFRA LIVE] `docker compose up` thành công (3 containers healthy).
  Chạy thật bắt 3 lỗi spec, đã vá tại chỗ: (1) config `vietnamese` FTS không tồn
  tại → tạo `COPY=simple` trong init.sql; (2) `unaccent()` cấm trong index →
  wrapper `f_unaccent()` IMMUTABLE; (3) UUID seed chứa ký tự g/h/i/j (ngoài hex)
  → đổi prefix 7/8/9/5. Verify: 15 bảng, seed đủ (3 users/5 entities/3 tasks),
  LTREE + ST_Distance + search không dấu `dau tay` đều xanh.
- [v20 OTP] Bổ sung ngoài tài liệu gốc: kích hoạt tài khoản chống số ảo + quên PIN
  cấp lại (AUTH-08 §7). DB: `otp_codes` + `phone_verified_at` (04-otp.sql, đã
  apply live + rerun idempotent sạch, đã mount entrypoint cho volume mới).
  Login hằng ngày vẫn PIN (OTP tốn SMS + kẹt offline). SMS gateway chốt interface
  (Log driver dev / HTTP driver prod, chưa chốt nhà cung cấp).

---

## 0. NGUYÊN TẮC & ĐỊNH NGHĨA HOÀN THÀNH

- Mọi task phải map được về ít nhất 1 item trong SOD/FSD/SAD/DDD/DOD/UI (cột Trace).
- Definition of Done chung: code + test chạy xanh + update docs tương ứng + demo được trên dữ liệu seed Demo Farm.
- Seed chuẩn toàn dự án (theo ví dụ UI-06): Farm `Nông Lạc Dalat Zone A` (code DL),
  `Zone A → Field 01 → Bed B01/B02`, công nhân `Ngô Văn An`, vật tư `NPK 16-16-8`,
  giống `Dâu tây Nhật Hana (F1)`, batch `#BATCH-882`.
- Toolchain: Node 20 LTS + pnpm 9, NestJS 10, Next.js 14, React Native 0.74 bare
  (WatermelonDB không chạy trên Expo Go), PostgreSQL 16 + PostGIS, Redis 7, EMQX 5.7.

---

## PHASE 0 — DỰNG KHUNG REPO (0.5–1 ngày)

| ID | Task | Trace |
|----|------|-------|
| P0-1 | `git init`, `.gitignore` (node, .env, Expo, OS), `.editorconfig`, `.nvmrc` (node 20) | DOD-05 |
| P0-2 | `README.md` mỗi thư mục (đã có root); `.env.example` cho backend/web/mobile-app | SAD-03 |
| P0-3 | Quy ước branch (`main/dev/feat/*`), commit message, PR checklist (link Trace ID) | SOD-01 |
| P0-4 | Design system CHỐT Ant Design (web): `ConfigProvider` khóa 1 lần — primary `#2E7D32`, `componentSize large`, font `Be Vietnam Pro` + Inter ≥16px, bo góc lớn, locale `viVN`; `AntdRegistry` cho Next App Router; Tailwind giữ cho layout; import modular + lazy-load cụm nặng (Mapbox/charts/admin) giữ first-load nhẹ. Màu alert `#D32F2F`/amber `#FFA000`/neutral giữ theo UI-06 §6. Phase 7 RN dùng React Native Paper (cùng tokens). | UI-06 §6 |

---

## PHASE 1 — INFRA + DATABASE (2–3 ngày)

| ID | Task | Trace |
|----|------|-------|
| P1-1 | `infra/docker-compose.yml` + `.env.example` (postgres/redis/emqx) — ĐÃ TẠO FILE, chờ VT-x để `up` | DOD-05 §1 |
| P1-2 | `infra/postgres/init.sql` từ DDD-04 (dùng `IF NOT EXISTS`) — ĐÃ TẠO FILE | DDD-04 |
| P1-3 | `docker compose up -d`, verify extensions: postgis, ltree, unaccent, uuid-ossp | DDD-04 §1 |
| P1-4 | Seed demo farm — SQL chốt tại `infra/postgres/03-seed.sql`: 1 owner, 1 manager, worker Ngô Văn An, farm DL, cây Zone A → Field 01 → Bed B01/B02 (+ Field 02); NPK 500→374.5kg + 2 phiếu xuất mẫu, batch `BATCH-DOU-2026-882` + VietGAP `VG-2026-882`, 3 tasks + 3 activities mẫu | UI-06 MH-08/09 |
| P1-5 | Test query mẫu: LTREE `path <@ 'DL.ZA'`, khoảng cách PostGIS `ST_Distance`, full-text `dau tay` không dấu ra `Dâu tây` | DDD-04 |
| P1-6 | **DDD-04 supplement (bắt buộc, vì DDD gốc thiếu):** DDL chốt tại `infra/postgres/02-supplement.sql` (chạy sau 01-schema.sql). 3 nhóm bảng mới, field bám đúng UI-06: (a) `tasks` (giao việc: entity, assignee, loại HĐ, ưu tiên, hạn, trạng thái — cho MH-02 + FSD phân công); (b) `materials` + `material_batches` (lô vật tư + giá nhập + tồn) + `inventory_transactions` (mỗi nhật ký mobile trừ kho — cho MH-04 dropdown + MH-10 đối soát); (c) `harvest_batches` (mã lô `#BATCH-*`, entity, ngày thu hoạch/đóng gói/HSD) + `certificates` (VietGAP/GlobalGAP + test dư lượng, gắn với lô); `products` link tới `harvest_batches` — cho MH-14/15/16 | FSD-02 §2/§3, MH-02/04/10/14/15/16 |

---

## PHASE 2 — BACKEND NESTJS (2–3 tuần)

### 2a. Auth + RBAC (P2-1 → P2-3)

| ID | Task | Trace |
|----|------|-------|
| P2-1 | `POST /api/v1/auth/login` (SĐT + PIN) + refresh rotation/reuse-detection + khóa 5 sai/15p + OTP kích hoạt/quên PIN (SmsProvider interface) — chi tiết tại `docs/AUTH-08-Auth-RBAC-Specification.md` | DOD-05 §2, MH-01 |
| P2-2 | Guard RBAC 8 rules (mở rộng từ ma trận 7 dòng FSD-02) + FarmGuard + test parameterized — chi tiết tại `docs/AUTH-08` §4/§5 | FSD-02 §1 |
| P2-3 | Rate limit Redis Throttler 100 req/phút/IP + Helmet + CORS allowlist domain chính thức | DOD-05 §2 |

### 2b. Farm Twin: farms + entities + seasons (P2-4 → P2-6)

| ID | Task | Trace |
|----|------|-------|
| P2-4 | CRUD `farms` + `entities` + API GeoJSON (kèm `status` màu derive, `area_m2`) + `POST /workforce/location` heartbeat cho layer realtime — chi tiết tại `docs/WEB-12` §1/§2 | FSD-02 §3, MH-08/09 |
| P2-5 | API move node (rewrite `path` LTREE cả subtree 1 transaction, 409 khi trùng) + quy tắc type-con — chi tiết tại `docs/WEB-12` §3 | MH-09 |
| P2-6 | CRUD `crop_seasons` + tiến độ % + giai đoạn + modal tạo mùa vụ (entity, yield kỳ vọng, norms, link lô vật tư — `docs/WEB-15` §1) | MH-10 |

### 2c. Activity + Evidence + Sync — LÕI OFFLINE-FIRST (P2-7 → P2-10)

| ID | Task | Trace |
|----|------|-------|
| P2-7 | `POST /api/v1/activities` (1-Tap log: type, entity, số lượng, `material_batch_id`, notes) + `GET /api/v1/material-batches` (dropdown MH-04) + ghi `inventory_transactions` trừ tồn trong cùng DB transaction (bảng từ P1-6) | MH-04, MH-10 |
| P2-8 | `POST /api/v1/storage/presigned-url` (15p, GCS ảnh / R2 video) + lưu `activity_evidence` — đúng 4 bước SAD-03 §3 | SAD-03 §3 |
| P2-9 | `POST /api/v1/sync/push` — chi tiết chốt tại `docs/SYNC-07-Sync-Engine-Specification.md` (batch + client IDs → validate GPS → transaction → ACK; idempotent; endpoint chờ worker ≤30s) | SAD-03 §2, MH-05 |
| P2-10 | Verify GPS ≤10m + policy FLAGGED (không reject mất log) — chi tiết tại `docs/WEB-10` §2/§4 | MH-11 |

### 2d. Audit + Anomaly + Costs (P2-11 → P2-13)

| ID | Task | Trace |
|----|------|-------|
| P2-11 | `audit_logs` append-only (KHÔNG có API update/delete), stream API filter đủ 4 tiêu chí + WebSocket auto-refresh — modal + rules tại `docs/WEB-10` | MH-11, FSD-02 §3 |
| P2-12 | Rules GPS_FAR/MISSING_EVIDENCE/OVER_NORM (định mức từ `crop_seasons.metadata.norms`) → panel MH-07 + MH-11 — chi tiết tại `docs/WEB-10` §4 | MH-07, MH-11 |
| P2-13 | API chi phí 3 nguồn (vật tư × giá nhập, công × hourly_rate, `operational_costs`) + chi phí/kg + dự báo lợi nhuận — công thức tại `docs/DASH-13` §2 | MH-12 |

### 2e. Marketplace + Truy xuất (P2-14 → P2-16)

| ID | Task | Trace |
|----|------|-------|
| P2-14 | CRUD `products` + catalog API (filter farm/cert/confidence/giá, sort, search không dấu) — chi tiết tại `docs/TRACE-11` §4 | MH-13/14 |
| P2-15 | API Live Traceability (timeline APPROVED + certs + confidence) — chi tiết tại `docs/TRACE-11` §1/§2 | MH-15, FSD-02 §4 |
| P2-16 | API public QR page (`packed_at` NULL = chưa kích hoạt) + report sai phạm/đặt trước — chi tiết tại `docs/TRACE-11` §3 | MH-16 |
| P2-17 | Swagger/OpenAPI toàn bộ API + collection test; media 100% private, chỉ phát Signed URL có hạn | DOD-05 §2 |

### 2f. Tasks + Harvest batch + Queue worker (P2-18 → P2-20, bổ sung sau review)

| ID | Task | Trace |
|----|------|-------|
| P2-18 | CRUD `tasks` + giao việc (OWNER/MANAGER → WORKER) + API list theo worker/ngày/ưu tiên cho MH-02 (cần làm/đã xong/chờ sync) | FSD-02 §1/§2, MH-02 |
| P2-19 | CRUD `harvest_batches` + `certificates` + link sang `products`; công thức confidence chốt tại `docs/TRACE-11` §1 (APPROVED có ảnh / tổng) | MH-14/15/16 |
| P2-20 | BullMQ worker xử lý `/sync/push` bất đồng bộ (Redis queue theo SAD-03) + retry/backoff + DLQ cho bản ghi lỗi — chi tiết tại `docs/SYNC-07` §6/§7 | SAD-03 §1/§2 |

---

## PHASE 3 — WEB FARMER + PWA + SIMPLE (2–3 tuần, LÊN TRƯỚC — web-first)

| ID | Task | Trace |
|----|------|-------|
| W3-1 | PWA shell Next.js: manifest cài đặt + SW 3 tầng cache + prompt iOS — `docs/PWA-16` §1/§2 | PWA-16 |
| W3-2 | IndexedDB outbox đúng hợp đồng SYNC-07 + foreground-sync + nút sync PENDING — `docs/PWA-16` §3/§4 | SYNC-07, PWA-16 |
| W3-3 | Farmer flows responsive (login/tasks/scan/1-tap/queue — tái dùng logic MOB-09/MOB-14; capture camera + canvas watermark + Geolocation) — `docs/PWA-16` §6 | MH-01→MH-05, MOB-09/14 |
| W3-4 | Simple mode (flag farm, 3 màn, tự duyệt, nâng cấp không migrate) — `docs/SIMPLE-17` | SIMPLE-17 |
| W3-5 | Web Push (iOS ≥16.4 đã cài) + PIN offline hash IndexedDB — `docs/PWA-16` §5 | PWA-16, AUTH-08 |
| W3-6 | Field test 2 máy thật (Android yếu + iPhone) theo acceptance PWA-16 §7 | PWA-16 §7 |
| W3-7 | DoD: các màn farmer đủ 4 states Loading/Error/Empty/Offline | UI-06 |

---

## PHASE 4 — WEB ADMIN NEXT.JS (2–3 tuần, MH-07 → MH-12)

| ID | Task | Trace |
|----|------|-------|
| P4-1 | Khung Next.js 14 + auth cookie + route guard OWNER/MANAGER/AGRONOMIST + layout header/nav | FSD-02 §1 |
| P4-2 | MH-07 dashboard (4 KPI theo công thức `docs/DASH-13` §1 + cost chart + anomaly panel link MH-11) | UI-06 MH-07 |
| P4-3 | MH-08 bản đồ Mapbox GL (vẽ/sửa polygon, layer phủ, sidebar cây, worker realtime, tile cache) — logic tại `docs/WEB-12` §1/§2 | UI-06 MH-08 |
| P4-4 | MH-09 entity tree (search, add/sửa/xóa, drag-drop gọi API move) — logic tại `docs/WEB-12` §3 | UI-06 MH-09 |
| P4-5 | MH-10 mùa vụ + bảng đối soát kho (popup log, dòng âm đỏ) — hành vi UI tại `docs/WEB-15` §1 | UI-06 MH-10 |
| P4-6 | MH-11 audit stream + evidence modal — logic chốt tại `docs/WEB-10-MH11-Audit-Evidence-Specification.md` | UI-06 MH-11 |
| P4-7 | MH-12 cost pie + unit cost + profit forecast (công thức `docs/DASH-13` §2) | UI-06 MH-12 |
| P4-8 | DoD màn hình: mỗi MH-07→MH-12 đủ 4 states Loading/Error/Empty/Offline theo spec | UI-06 |

---

## PHASE 5 — MARKETPLACE + PUBLIC TRACE (2 tuần, MH-13 → MH-16)

| ID | Task | Trace |
|----|------|-------|
| P5-1 | MH-13 home + search + hero banner (click → MH-14 lọc farm) + grid badge confidence — `docs/WEB-15` §2 | UI-06 MH-13 |
| P5-2 | MH-14 catalog: filter farm/chứng nhận/confidence >90%, sort, ISR | UI-06 MH-14 |
| P5-3 | MH-15 product detail + Live Trace widget + lightbox ảnh gốc kèm watermark | UI-06 MH-15 |
| P5-4 | MH-16 public QR page <0.5s + offline cache + form báo cáo sai phạm | UI-06 MH-16 |
| P5-5 | SEO: JSON-LD Product động + sitemap.xml động + robots + `next/image` WebP/AVIF qua CDN, target <1s | DOD-05 §3 |
| P5-6 | DoD màn hình: MH-13→MH-16 đủ states Loading/Error/Empty/Offline(ISR-cache) theo spec | UI-06 |

---

## PHASE 6 — HARDENING + RELEASE (1 tuần)

| ID | Task | Trace |
|----|------|-------|
| P6-1 | Kiểm lại checklist DOD-05 §2 (token, rate limit, signed URL, CORS/Helmet) bằng test xâm nhập cơ bản | DOD-05 §2 |
| P6-2 | Backup: `pg_dump` cron + snapshot volumes; runbook restore | DDD-04 |
| P6-3 | Deploy staging trên VPS qua Coolify + Nginx, UAT full flow QR ngoài đồng → sync → audit → mua hàng → quét tem | UI-06 flow matrix §5 |
| P6-4 | IoT-ready: bật EMQX container, tạo topic quy ước (`farm/{id}/sensor`), GHI CHÚ TimescaleDB để phase IoT (chưa cài) | SAD-03 §4 |

---

## PHASE 7 — MOBILE NATIVE RN (SAU MVP — web-first, ID P3-x giữ nguyên để khỏi vỡ tham chiếu)

| ID | Task | Trace |
|----|------|-------|
| P3-1 | Khởi tạo RN bare + WatermelonDB schema (§1 `docs/MOB-14`) + cột `sync_status`; SecureStore thay hash IndexedDB; in Bluetooth MH-06 (bản web đã fallback PNG) | MH-01/06, SAD-03, PWA-16 |
| P3-2 | MH-01 Login + Offline mode — chi tiết `docs/MOB-14` §2 (logic AUTH-08) | UI-06 MH-01 |
| P3-3 | MH-02 Tasks dashboard (3 KPI, tag màu ưu tiên, filter Zone/Field, bottom nav, FAB) — data P2-18, chi tiết `docs/MOB-14` §3 | UI-06 MH-02 |
| P3-4 | MH-03 QR scan + GPS badge + warn lệch 50m + 2 nút đi MH-04/MH-06 — chi tiết `docs/MOB-14` §4 | UI-06 MH-03 |
| P3-5 | MH-04 form 1-Tap — logic chốt tại `docs/MOB-09-MH04-One-Tap-Form-Specification.md` (grid 6 loại → enum, dropdown loạt vật tư, numpad + unit auto, camera trực tiếp + watermark, lưu PENDING 1 transaction) | UI-06 MH-04 |
| P3-6 | MH-05 queue manager (thumbnail, progress, retry, auto-sync media-trước-JSON-sau) — chi tiết `docs/MOB-14` §5 + SYNC-07 | UI-06 MH-05, SAD-03 §2/§3 |
| P3-7 | MH-06 plant passport (timeline, mini-map, in QR Bluetooth) — chi tiết `docs/MOB-14` §6 | UI-06 MH-06 |
| P3-8 | DoD màn hình: mỗi MH-01→MH-06 demo đủ 4 states Loading/Error/Empty/Offline theo spec | UI-06 |

---

## MVP ĐỀ XUẤT (WEB-FIRST — cắt để demo sớm)

P0 + P1 (kèm P1-6 supplement) + P2a/b/c/f + P2-16 (API QR public) + Phase 3-web
(W3-1→W3-6: PWA + farmer flows + simple) + P4-3/P4-4/P4-6 tối thiểu + P5-4.
→ Demo được vòng giá trị cốt lõi trên 1 app web duy nhất: cài PWA → quét QR →
ghi nhật ký có ảnh GPS → sync → admin thấy + duyệt → người mua quét tem.
Phase 7 (RN) và IoT sau MVP.

## RỦI RO LỚN

1. Sync engine xung đột/mất dữ liệu (P2-9/W3-2) — giảm bằng idempotency key + test retry/timeout + field test 2 máy thật.
2. Gallery-bypass trên web (không cấm tuyệt đối như native) — đỡ bằng rule `EXIF_INVALID` + FLAGGED-duyệt tay; dư lượng rủi ro ghi nhận, RN phase 7 xử lý triệt để.
3. iOS không background sync — bù foreground-sync + nút sync nổi; push yêu cầu PWA đã cài + iOS ≥16.4.
4. GPS thực tế ngoài đồng lệch lớn — ngưỡng duyệt 10m / scan 50m phải test thực địa, quản lý override có audit.
5. Mapbox token/cost + tile offline — cache vector tile LRU 200MB theo PWA-16 §2.
6. WatermelonDB/RN bare (Phase 7) — rủi ro dời lại sau MVP, không chặn web-first.
