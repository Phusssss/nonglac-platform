CREATE TABLE IF NOT EXISTS nl_users (
  id TEXT PRIMARY KEY, email VARCHAR(255) UNIQUE NOT NULL, phone VARCHAR(30) UNIQUE,
  password_hash TEXT NOT NULL, full_name VARCHAR(160) NOT NULL, role VARCHAR(30) NOT NULL DEFAULT 'WORKER',
  is_active BOOLEAN NOT NULL DEFAULT TRUE, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nl_farms (
  id TEXT PRIMARY KEY, owner_id TEXT NOT NULL REFERENCES nl_users(id), code VARCHAR(50) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL, address TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION, notes TEXT,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nl_entities (
  id TEXT PRIMARY KEY, farm_id TEXT NOT NULL REFERENCES nl_farms(id) ON DELETE CASCADE,
  parent_id TEXT REFERENCES nl_entities(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('ZONE','FIELD','GREENHOUSE','BLOCK','BED','ROW','PLANT','STORAGE','PROCESSING_AREA')),
  code VARCHAR(80) NOT NULL, name VARCHAR(160) NOT NULL, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  depth INT NOT NULL DEFAULT 1, status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(farm_id, code)
);

CREATE INDEX IF NOT EXISTS nl_entities_farm_idx ON nl_entities(farm_id, depth, code);

CREATE TABLE IF NOT EXISTS nl_seasons (
  id TEXT PRIMARY KEY, farm_id TEXT NOT NULL REFERENCES nl_farms(id) ON DELETE CASCADE,
  entity_id TEXT NOT NULL REFERENCES nl_entities(id), name VARCHAR(200) NOT NULL, crop_name VARCHAR(120) NOT NULL,
  variety VARCHAR(120), start_date DATE NOT NULL, expected_harvest_date DATE, actual_harvest_date DATE,
  status VARCHAR(40) NOT NULL DEFAULT 'IN_PROGRESS', created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nl_activities (
  id TEXT PRIMARY KEY, farm_id TEXT NOT NULL REFERENCES nl_farms(id) ON DELETE CASCADE,
  target_entity_id TEXT NOT NULL REFERENCES nl_entities(id), season_id TEXT REFERENCES nl_seasons(id),
  type VARCHAR(30) NOT NULL CHECK (type IN ('SEEDING','PLANTING','IRRIGATION','FERTILIZATION','PESTICIDE','PRUNING','HARVEST','INSPECTION','OTHER')),
  performed_by TEXT NOT NULL REFERENCES nl_users(id), started_at TIMESTAMPTZ NOT NULL, ended_at TIMESTAMPTZ,
  quantity NUMERIC(12,2), unit VARCHAR(30), notes TEXT, weather JSONB NOT NULL DEFAULT '{}'::jsonb,
  source VARCHAR(30) NOT NULL DEFAULT 'USER', evidence_level VARCHAR(30) NOT NULL DEFAULT 'USER_REPORTED',
  verification_status VARCHAR(30) NOT NULL DEFAULT 'PENDING', verification_note TEXT,
  verified_by TEXT REFERENCES nl_users(id), verified_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS nl_activities_farm_started_idx ON nl_activities(farm_id, started_at DESC);
CREATE INDEX IF NOT EXISTS nl_activities_season_idx ON nl_activities(season_id, started_at DESC);

CREATE TABLE IF NOT EXISTS nl_evidence (
  id TEXT PRIMARY KEY, activity_id TEXT NOT NULL REFERENCES nl_activities(id) ON DELETE CASCADE,
  type VARCHAR(30) NOT NULL CHECK (type IN ('PHOTO','VIDEO','GPS_TRACE','QR_SCAN','SENSOR','NOTE')),
  media_url TEXT, latitude DOUBLE PRECISION, longitude DOUBLE PRECISION,
  captured_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), device_info JSONB NOT NULL DEFAULT '{}'::jsonb,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb
);

CREATE TABLE IF NOT EXISTS nl_audit_logs (
  id TEXT PRIMARY KEY, user_id TEXT REFERENCES nl_users(id), entity_type VARCHAR(50) NOT NULL,
  entity_id TEXT NOT NULL, action VARCHAR(40) NOT NULL, old_value JSONB, new_value JSONB,
  reason TEXT, ip_address INET, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS nl_alerts (
  id TEXT PRIMARY KEY, farm_id TEXT NOT NULL REFERENCES nl_farms(id) ON DELETE CASCADE,
  activity_id TEXT REFERENCES nl_activities(id) ON DELETE CASCADE, type VARCHAR(60) NOT NULL,
  severity VARCHAR(20) NOT NULL DEFAULT 'MEDIUM', message TEXT NOT NULL, status VARCHAR(20) NOT NULL DEFAULT 'OPEN',
  resolved_by TEXT REFERENCES nl_users(id), resolved_at TIMESTAMPTZ, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(activity_id, type, status)
);