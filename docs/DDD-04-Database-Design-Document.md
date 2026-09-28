# DDD-04: TÀI LIỆU THIẾT KẾ CƠ SỞ DỮ LIỆU (DATABASE DESIGN DOCUMENT)

---

## 1. ĐỊNH NGHĨA DDL SQL SCHEMA CHI TIẾT

```sql
-- Khởi tạo Extensions bắt buộc
CREATE EXTENSION IF NOT EXISTS postgis;
CREATE EXTENSION IF NOT EXISTS ltree;
CREATE EXTENSION IF NOT EXISTS unaccent;
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Bảng Người dùng & Phân quyền (RBAC)
CREATE TYPE user_role AS ENUM ('SUPER_ADMIN', 'FARM_OWNER', 'FARM_MANAGER', 'AGRONOMIST', 'WORKER', 'BUYER');

CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(20) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    full_name VARCHAR(100) NOT NULL,
    role user_role NOT NULL DEFAULT 'WORKER',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Bảng Nông trại
CREATE TABLE farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    boundary GEOMETRY(Polygon, 4326),
    address TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Bảng Cấu trúc Thực thể Động (Áp dụng LTREE & PostGIS)
CREATE TYPE entity_type AS ENUM ('ZONE', 'FIELD', 'GREENHOUSE', 'BLOCK', 'BED', 'ROW', 'PLANT', 'STORAGE', 'PROCESSING_AREA');

CREATE TABLE entities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES entities(id) ON DELETE CASCADE,
    type entity_type NOT NULL,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    path LTREE NOT NULL, -- Ví dụ: 'FarmA.Zone1.Field01.Bed03'
    geometry GEOMETRY(Geometry, 4326),
    status VARCHAR(50) DEFAULT 'ACTIVE',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    CONSTRAINT unique_entity_code_per_farm UNIQUE (farm_id, code)
);

CREATE INDEX idx_entities_path_gist ON entities USING GIST (path);
CREATE INDEX idx_entities_geometry ON entities USING GIST (geometry);

-- 4. Bảng Mùa vụ Canh tác
CREATE TABLE crop_seasons (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    entity_id UUID NOT NULL REFERENCES entities(id),
    crop_name VARCHAR(100) NOT NULL,
    variety VARCHAR(100),
    start_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    status VARCHAR(50) DEFAULT 'IN_PROGRESS',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Bảng Hoạt động Canh tác
CREATE TYPE activity_type AS ENUM ('SEEDING', 'PLANTING', 'IRRIGATION', 'FERTILIZATION', 'PESTICIDE', 'PRUNING', 'HARVEST', 'INSPECTION');
CREATE TYPE evidence_level AS ENUM ('USER_REPORTED', 'EVIDENCE_SUPPORTED', 'DEVICE_SUPPORTED', 'AUTOMATED');

CREATE TABLE cultivation_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    target_entity_id UUID NOT NULL REFERENCES entities(id),
    crop_season_id UUID REFERENCES crop_seasons(id),
    type activity_type NOT NULL,
    performed_by UUID NOT NULL REFERENCES users(id),
    started_at TIMESTAMPTZ NOT NULL,
    ended_at TIMESTAMPTZ,
    quantity NUMERIC(10, 2),
    unit VARCHAR(20),
    notes TEXT,
    source VARCHAR(50) DEFAULT 'USER',
    evidence_level evidence_level DEFAULT 'USER_REPORTED',
    verification_status VARCHAR(50) DEFAULT 'PENDING',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Bảng Bằng chứng Bất biến (Evidence)
CREATE TABLE activity_evidence (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    activity_id UUID NOT NULL REFERENCES cultivation_activities(id) ON DELETE CASCADE,
    evidence_type VARCHAR(50) NOT NULL, -- PHOTO, VIDEO, GPS_TRACE, QR_SCAN
    media_url TEXT,
    gps_location GEOMETRY(Point, 4326),
    captured_at TIMESTAMPTZ NOT NULL,
    device_info JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb
);

-- 7. Bảng Nhật ký Kiểm toán Immutable (Audit Trail)
CREATE TABLE audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    entity_type VARCHAR(50) NOT NULL,
    entity_id UUID NOT NULL,
    action VARCHAR(20) NOT NULL,
    old_value JSONB,
    new_value JSONB,
    reason TEXT,
    ip_address INET,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. Bảng Sản phẩm Sàn Chợ Nông Lạc
CREATE TABLE products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farms(id),
    crop_season_id UUID REFERENCES crop_seasons(id),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    description TEXT,
    price NUMERIC(12, 2) NOT NULL,
    unit VARCHAR(50) NOT NULL,
    stock_quantity NUMERIC(10, 2) NOT NULL DEFAULT 0,
    images TEXT[] DEFAULT '{}',
    is_published BOOLEAN DEFAULT FALSE,
    seo_metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_products_search ON products 
USING GIN (to_tsvector('vietnamese', unaccent(title || ' ' || COALESCE(description, ''))));
```
