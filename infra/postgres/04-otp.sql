-- Migration 04-otp — OTP kích hoạt tài khoản + quên PIN (AUTH-08 §7).
-- File init (01/02/03) chỉ chạy khi volume mới; file này chạy BẰNG TAY trên DB live:
--   Get-Content 04-otp.sql | docker exec -i nonglac_db psql -U nonglac_user -d nonglac_db
-- Idempotent: chạy lại an toàn.

-- Cờ SĐT đã xác thực (seed cũ + tài khoản tạo tay bởi admin: coi như verified)
ALTER TABLE users
    ADD COLUMN IF NOT EXISTS phone_verified_at TIMESTAMPTZ;

-- Tài khoản seed/admin-tạo: đánh dấu verified (không bắt OTP ngược)
UPDATE users SET phone_verified_at = NOW() WHERE phone_verified_at IS NULL;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'otp_purpose') THEN
        CREATE TYPE otp_purpose AS ENUM ('ACTIVATION', 'PIN_RESET');
    END IF;
END $$;

CREATE TABLE IF NOT EXISTS otp_codes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20) NOT NULL, -- snapshot SĐT lúc phát mã (chống đổi số giữa chừng)
    purpose otp_purpose NOT NULL,
    code_hash VARCHAR(255) NOT NULL, -- bcrypt OTP 6 số, KHÔNG lưu plaintext
    expires_at TIMESTAMPTZ NOT NULL, -- phát hành + 10 phút
    attempts SMALLINT NOT NULL DEFAULT 0, -- tối đa 5 lần nhập
    consumed_at TIMESTAMPTZ, -- đã dùng → vô hiệu
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otp_lookup
    ON otp_codes (user_id, purpose, consumed_at, expires_at);
