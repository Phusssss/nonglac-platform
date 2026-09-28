-- P1-6 supplement — BỔ SUNG DDD-04 (v1 draft, chờ review).
-- DDD-04 gốc thiếu 3 nhóm bảng mà UI-06/FSD-02 bắt buộc.
-- File chạy SAU 01-schema.sql (mount cùng thư mục docker-entrypoint-initdb.d).
-- Quy ước: UUID PK, IF NOT EXISTS, field bám đúng tên hiển thị trên UI-06.

-- =====================================================================
-- (a) TASKS — giao việc cho MH-02 + FSD-02 "Phân công Công việc (Task)"
-- MH-02 cần: tiêu đề việc, tag ưu tiên màu (cao/TB/thấp), vị trí thửa/luống,
-- giờ (08:00), checkbox trạng thái, 3 KPI (cần làm/đã xong/chờ sync).
-- =====================================================================
CREATE TYPE task_status AS ENUM ('TODO', 'IN_PROGRESS', 'DONE', 'CANCELLED');
CREATE TYPE task_priority AS ENUM ('HIGH', 'MEDIUM', 'LOW');

CREATE TABLE IF NOT EXISTS tasks (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    target_entity_id UUID NOT NULL REFERENCES entities(id),
    crop_season_id UUID REFERENCES crop_seasons(id),
    type activity_type NOT NULL, -- tái dùng enum DDD: Tưới/Bón/Phun/Tỉa/Thu hoạch...
    title VARCHAR(255) NOT NULL, -- vd: "Bón phân Luống B2"
    priority task_priority NOT NULL DEFAULT 'MEDIUM',
    assigned_to UUID REFERENCES users(id), -- WORKER nhận việc
    assigned_by UUID REFERENCES users(id), -- OWNER/MANAGER giao việc
    due_at TIMESTAMPTZ, -- hạn/giờ hiển thị trên MH-02
    status task_status NOT NULL DEFAULT 'TODO',
    completed_activity_id UUID REFERENCES cultivation_activities(id), -- nhật ký hoàn thành
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_tasks_worker_day ON tasks (assigned_to, status, due_at);
CREATE INDEX IF NOT EXISTS idx_tasks_farm ON tasks (farm_id);

-- =====================================================================
-- (b) KHO VẬT TƯ — dropdown MH-04 + đối soát MH-10 + trừ kho P2-7
-- MH-04 cần: "Loạt vật tư: [Phân NPK 16-16-8 v]" + số lượng + đơn vị.
-- MH-10 cần: Tên vật tư | Tồn đầu | Đã khấu trừ (tự động) | Tồn hiện tại,
-- click số khấu trừ → popup danh sách nhật ký đã dùng.
-- =====================================================================
CREATE TABLE IF NOT EXISTS materials (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL, -- vd: "Phân NPK 16-16-8"
    unit VARCHAR(20) NOT NULL, -- kg / L / cuộn / bao
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_material_name_per_farm UNIQUE (farm_id, name)
);

CREATE TABLE IF NOT EXISTS material_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_id UUID NOT NULL REFERENCES materials(id) ON DELETE CASCADE,
    batch_code VARCHAR(50), -- mã lô nhập kho (khác lô thu hoạch harvest_batches)
    initial_qty NUMERIC(12, 2) NOT NULL, -- Tồn đầu (MH-10: 500 kg)
    current_qty NUMERIC(12, 2) NOT NULL, -- Tồn hiện tại (MH-10: 374.5 kg)
    unit_price NUMERIC(12, 2), -- giá nhập → nguồn tính chi phí MH-12
    imported_at DATE,
    expiry_date DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TYPE inventory_tx_type AS ENUM ('IMPORT', 'USE', 'ADJUST');

CREATE TABLE IF NOT EXISTS inventory_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    material_batch_id UUID NOT NULL REFERENCES material_batches(id) ON DELETE CASCADE,
    activity_id UUID REFERENCES cultivation_activities(id), -- nhật ký mobile gây khấu trừ
    type inventory_tx_type NOT NULL,
    quantity NUMERIC(10, 2) NOT NULL, -- USE ghi số âm; IMPORT số dương
    performed_by UUID REFERENCES users(id),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_inventory_batch ON inventory_transactions (material_batch_id, created_at);

-- Nhật ký 1-Tap phải chọn được loạt vật tư (MH-04 MaterialSelectDropdown)
ALTER TABLE cultivation_activities
    ADD COLUMN IF NOT EXISTS material_batch_id UUID REFERENCES material_batches(id);

-- =====================================================================
-- (c) LÔ THU HOẠCH + CHỨNG NHẬN — MH-14/15/16
-- MH-14 cần: "Lô thu hoạch: #BATCH-882" + filter chứng nhận + sort confidence.
-- MH-15 cần: compliance "VietGAP Code: VG-2026-882".
-- MH-16 cần: mã lô, ngày đóng gói/HSD, nơi sản xuất, ảnh thu hoạch, chứng nhận.
-- =====================================================================
CREATE TABLE IF NOT EXISTS harvest_batches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_season_id UUID REFERENCES crop_seasons(id),
    entity_id UUID REFERENCES entities(id), -- lô đất sản xuất (Luống B02, Thửa 01)
    code VARCHAR(50) UNIQUE NOT NULL, -- vd: "BATCH-DOU-2026-882"
    harvested_at TIMESTAMPTZ,
    packed_at DATE, -- ngày đóng gói (MH-16)
    expiry_date DATE, -- HSD (MH-16)
    quantity NUMERIC(10, 2),
    unit VARCHAR(50), -- đồng bộ độ dài với products.unit
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS certificates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    harvest_batch_id UUID NOT NULL REFERENCES harvest_batches(id) ON DELETE CASCADE,
    cert_type VARCHAR(50) NOT NULL, -- VietGAP / Organic / GlobalGAP / RESIDUE_TEST
    cert_code VARCHAR(100), -- vd: "VG-2026-882"
    result VARCHAR(20) DEFAULT 'PASSED', -- PASSED / FAILED
    issued_at DATE,
    expired_at DATE,
    document_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cert_batch ON certificates (harvest_batch_id);

-- Sản phẩm sàn chợ thuộc về 1 lô thu hoạch (truy xuất ngược về timeline)
ALTER TABLE products
    ADD COLUMN IF NOT EXISTS harvest_batch_id UUID REFERENCES harvest_batches(id);

-- Chi phí vận hành nhập tay cho MH-12 (điện/nước/xăng — không sinh từ nhật ký)
CREATE TABLE IF NOT EXISTS operational_costs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    crop_season_id UUID REFERENCES crop_seasons(id),
    category VARCHAR(50) NOT NULL, -- ELECTRICITY / WATER / FUEL / OTHER
    amount NUMERIC(12, 2) NOT NULL,
    incurred_at DATE NOT NULL,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_ops_cost_season ON operational_costs (crop_season_id, incurred_at);

-- GHI CHÚ REVIEW (mở):
-- R1. Data-confidence %: DERIVE (tỷ lệ evidence verified / tổng evidence của batch),
--     không tạo bảng, công thức chốt ở P2-19.
-- R2. Đơn giá nhân công cho MH-12: DDD + UI-06 đều không có → v1 LẤY TỪ tasks/completed
--     log giờ công × đơn giá cấu hình trong farms.metadata; nếu không đủ thì bổ sung sau.
