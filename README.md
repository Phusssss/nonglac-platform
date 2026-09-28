# Nông Lạc Digital Farm Platform

Bản sao số (Digital Twin) nông trại + Sàn chợ minh bạch truy xuất nguồn gốc.

## Tài liệu gốc (`docs/`)
- `SOD-01-System-Overview-Document.md` — Tầm nhìn, 5 nguyên tắc (Location/Event/Evidence/Automation/Human Friendly), traceability matrix
- `FSD-02-Functional-Specification-Document.md` — RBAC, Mobile App, Web Admin, Marketplace
- `SAD-03-System-Architecture-Design.md` — Component architecture, Sync Engine, Direct Upload, IoT preparedness
- `DDD-04-Database-Design-Document.md` — DDL PostgreSQL 16 + PostGIS + LTREE + unaccent
- `DOD-05-DevOps-Security-Deployment.md` — Docker Compose (postgres/redis/emqx), Security, SEO
- `UI-06-Screen-Design-Specification.md` — MH-01 → MH-16 (Mobile, Web Admin, Marketplace)

## Cấu trúc monorepo
```
nonglac-platform/
  docs/        # 6 spec đã move từ Downloads
  backend/     # NestJS API (PostgreSQL + PostGIS/LTREE, Redis/BullMQ, EMQX MQTT)
  web/         # Next.js 14 (Web Admin + Marketplace, Mapbox GL, SEO ISR)
  mobile-app/  # React Native (WatermelonDB Offline-First, QR/GPS, 1-Tap form)
  infra/       # Docker Compose, Nginx/Coolify, GCS + Cloudflare R2
```

## Stack chính (theo SAD-03 + DOD-05)
- Mobile: React Native + WatermelonDB, QR scan, GPS watermark
- Web: Next.js 14, Mapbox GL / Leaflet, Tailwind + Shadcn UI
- Backend: NestJS, PostgreSQL 16 (PostGIS, LTREE, unaccent, TimescaleDB ready), Redis, EMQX
- Storage: GCS (ảnh) + Cloudflare R2 (video), Presigned URL 15 phút
- Auth: JWT Access 15p (memory) + Refresh HttpOnly SameSite=Strict, PIN offline

## Next step gợi ý
1. `backend/`: init NestJS + TypeORM/Prisma + DDL từ DDD-04
2. `infra/`: tách `docker-compose.yml` từ DOD-05
3. `web/` + `mobile-app/`: scaffold theo UI-06 (MH-01→MH-16)
