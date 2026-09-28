# SYNC-07: ĐẶC TẢ SYNC ENGINE OFFLINE-FIRST (v2 — đã review, chốt ACK đồng bộ)

**Nguồn**: SAD-03 §2/§3, UI-06 MH-05/MH-11, DOD-05 §2, PLAN P2-9/P2-20/P3-6
**Phạm vi**: Mobile (mất mạng ngoài đồng) → NestJS → PostgreSQL. Master data
(farms/entities) chỉ sync 1 chiều server→client (pull); activity/evidence/tasks
sync 2 chiều qua push + ACK.

---

## 1. LUỒNG TỔNG THỂ (khớp SAD-03 §2 + MH-05)

```
Mobile (offline)                          NestJS                        PostgreSQL
[Tạo activity + chụp ảnh]                       │                                │
 status=PENDING (local)                         │                                │
      │                                         │                                │
[Có mạng]                                       │                                │
 ├─ 1. Upload media → GCS/R2 ──────────────────►│ (lấy presigned URL trước,      │
 │    (PUT trực tiếp, SAD-03 §3)                │  PUT không qua backend)        │
 ├─ 2. POST /sync/push ────────────────────────►│                                │
 │    (batch + client_ids + media_urls)         │                                │
 │                                              ├─ 3. Enqueue BullMQ ───────────►│
 │                                              │◄─ 4. Worker: validate GPS ────│
 │                                              │    + DB transaction ──────────│
 │    ◄─ 5. ACK [{client_id, server_id}] ───────┤                                │
[Update local: SYNCED / ERROR]                  │                                │
```

Thứ tự bắt buộc: **media trước, JSON sau** (P3-6) — server không nhận activity
có `media_url` chưa tồn tại. Presigned URL lấy ở `POST /storage/presigned-url`,
hết hạn 15 phút (SAD-03 §3); URL hết hạn trước khi push → client xin lại, không
dùng URL cũ.

**Chế độ ACK (chốt sau review):** endpoint ĐỒNG BỘ — nhận request → enqueue BullMQ
→ chờ worker xong (tối đa 30s) → trả full ACK (đúng 5 bước SAD-03 §2).
Quá 30s → trả `{status:"JOB_PENDING", job_id}`; client retry/pull lại sau,
idempotency (§4) đảm bảo không trùng.

## 2. OUTBOX PHÍA CLIENT (WatermelonDB)

Bảng `sync_outbox`: `client_id` (UUID, PK local), `table` (activities/evidence/tasks),
`op` (CREATE — v1 không cho sửa/xóa log đã sync, đúng audit bất biến),
`payload` JSON, `occurred_at`, `retry_count`, `status` (PENDING/UPLOADING/SYNCED/ERROR),
`last_error`. Media file lưu local path, upload ở bước 1 rồi thay bằng URL.

## 3. HỢP ĐỒNG API `POST /api/v1/sync/push`

Request:
```json
{
  "device_id": "uuid-thiet-bi",
  "items": [{
    "client_id": "uuid-local",
    "table": "cultivation_activities",
    "payload": { "farm_id": "...", "target_entity_id": "...", "type": "FERTILIZATION",
      "started_at": "2026-09-22T08:15:00+07:00", "quantity": 2.5, "unit": "kg",
      "material_batch_id": "...", "notes": "...",
      "evidence": [{ "evidence_type": "PHOTO", "media_url": "https://...",
        "gps_location": [108.45831, 11.94041], "captured_at": "..." }] }
  }]
}
```
Giới hạn: tối đa 50 items/request, payload ≤ 5MB (ảnh/video đã nằm trên storage).
Batch 50 items vừa khớp MH-05 "đồng bộ tất cả", vừa khó vượt rate limit
100 req/phút/IP của DOD-05 §2.

Response ACK:
```json
{ "results": [
  { "client_id": "...", "server_id": "uuid", "status": "ACCEPTED" },
  { "client_id": "...", "status": "REJECTED", "code": "GPS_MISMATCH",
    "message": "GPS ảnh cách thực thể 150m" }
]}
```

## 4. IDEMPOTENCY (chống trùng khi retry/timeout)

Bảng `sync_idempotency(device_id, client_id, server_table, server_id, created_at)`
với UNIQUE `(device_id, client_id)`. Worker kiểm tra trước khi insert:
trùng → trả lại `server_id` cũ, status ACCEPTED (không insert lần 2).
Client coi timeout không ACK = chưa sync, gửi lại toàn batch — server tự khử trùng.

## 5. VALIDATE PHÍA SERVER (trước transaction)

1. Auth + RBAC (WORKER chỉ push cho farm mình) + rate limit DOD-05.
2. FK tồn tại: farm/entity/season/material_batch; `started_at` không ở tương lai quá 24h (lệch đồng hồ).
3. GPS verify (P2-10): `ST_Distance(gps_ảnh, geometry_thực_thể) ≤ 10m` → HỢP LỆ.
   **Policy: vi phạm KHÔNG reject** → `verification_status='FLAGGED'` + sinh anomaly
   cho MH-11, quản lý DUYỆT/CẢNH BÁO bằng tay (đúng EvidenceModal MH-11).
4. EXIF-web rule (bổ sung cho client browser, PWA-16 §6): ảnh thiếu GPS EXIF
   hoặc giờ chụp lệch giờ server > 30 phút → REJECT `EXIF_INVALID` ngay
   (chống nộp ảnh thư viện cũ qua web).

## 6. WORKER TRANSACTION (BullMQ, P2-20)

Một job = 1 batch (≤50 items), chạy tuần tự trong 1 DB transaction:
insert `cultivation_activities` (+ `material_batch_id`) → insert
`activity_evidence` → insert `inventory_transactions` USE (trừ kho) →
update `tasks.status=DONE` + `completed_activity_id` (nếu item link task) →
insert `audit_logs` → ghi `sync_idempotency` → COMMIT → ACK.
Lỗi validation item nào → REJECT item đó, các item khác vẫn commit (partial ACK).

## 7. RETRY / DLQ

BullMQ: attempts=5, backoff exponential (5s→5phút). Lỗi 4xx-validation →
không retry (REJECT ngay). Lỗi 5xx/timeout → retry. Hết attempts → DLQ
(`sync_dlq`) + alert, quản lý xử lý tay. Client: 401 → refresh token rồi gửi lại;
429/5xx → backoff; REJECT-validation → đánh ERROR, cho sửa/chụp lại (MH-05).

## 8. XUNG ĐỘT

- Log canh tác append-only: client-wins (không sửa bản đã SYNCED — muốn sửa thì
  tạo activity hiệu chỉnh mới, giữ audit bất biến).
- Master data (geometry, cây LTREE): server-wins; mobile pull về đè local
  (trừ outbox PENDING).
- Task status: chỉ cho chuyển TODO→IN_PROGRESS→DONE; DONE có `completed_activity_id`
  thì khóa (muốn mở lại cần MANAGER + ghi audit).

## 9. PULL (server → client)

`GET /api/v1/sync/pull?since=<timestamp>`: trả master data đổi sau `since`
(entities, tasks được giao, materials) + `server_time` để client chỉnh lệch đồng hồ.
Mobile gọi sau mỗi lần push thành công và khi mở MH-02 (pull-to-refresh).
Request pull kèm `pending_count` (số outbox PENDING local) → server dùng cho
KPI "đang đọng" MH-07 (DASH-13 §1).

## 10. TEST MATRIX (bắt buộc xanh trước khi qua Phase 3)

| Case | Expect |
|------|--------|
| Offline 3 ngày → online, 200 items | đủ 200 ACCEPTED, tồn kho trừ đúng |
| Timeout sau commit, client gửi lại | không trùng (idempotency trả server_id cũ) |
| GPS lệch 150m | FLAGGED + anomaly MH-11, không mất log |
| Thiếu ảnh (MH-04 bắt buộc) | REJECT `EVIDENCE_REQUIRED` |
| Đồng hồ máy nhanh 2 ngày | REJECT `CLOCK_SKEW` |
| 2 máy cùng push 1 batch retry | 1 bản ghi duy nhất |
| Worker crash giữa transaction | rollback, retry ra ACCEPTED đúng 1 lần |

## 11. ACCEPTANCE

- MH-05: progressbar %, retry tay, auto-sync khi có mạng, badge số PENDING khớp outbox.
- MH-11: log FLAGGED hiện kèm khoảng cách GPS + nút DUYỆT/CẢNH BÁO.
- p95 push 50 items < 10s trên 4G; DLQ có alert.
