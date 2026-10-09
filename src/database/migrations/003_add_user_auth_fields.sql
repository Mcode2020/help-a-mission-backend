-- Migration 003: Add authentication fields (password_hash, password_algorithm, role, last_login_at) to users table

DO $$
BEGIN
    -- Add password_hash column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_hash'
    ) THEN
        ALTER TABLE users ADD COLUMN password_hash VARCHAR(255) NULL;
    END IF;

    -- Add password_algorithm column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'password_algorithm'
    ) THEN
        ALTER TABLE users ADD COLUMN password_algorithm VARCHAR(32) NOT NULL DEFAULT 'argon2id';
    END IF;

    -- Add role column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'role'
    ) THEN
        ALTER TABLE users ADD COLUMN role VARCHAR(32) NOT NULL DEFAULT 'donor';
    END IF;

    -- Add last_login_at column if not exists
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'users' AND column_name = 'last_login_at'
    ) THEN
        ALTER TABLE users ADD COLUMN last_login_at TIMESTAMPTZ NULL;
    END IF;
END $$;
