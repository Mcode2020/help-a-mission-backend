-- Migration 001: Initial Schema for Admin Authentication & RBAC

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(64) UNIQUE NOT NULL,
  name VARCHAR(128) NOT NULL,
  description TEXT,
  is_system BOOLEAN NOT NULL DEFAULT FALSE,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ
);

-- 2. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key VARCHAR(64) UNIQUE NOT NULL,
  module VARCHAR(64) NOT NULL DEFAULT 'system',
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROLE_PERMISSIONS JOIN TABLE
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. ADMIN_SESSIONS TABLE
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID NOT NULL REFERENCES admins(id) ON DELETE CASCADE,
  session_token_hash VARCHAR(255) UNIQUE NOT NULL,
  user_agent TEXT,
  ip_address VARCHAR(45),
  expires_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- SEED BASE ROLES
INSERT INTO roles (key, name, description)
VALUES 
  ('SUPER_ADMIN', 'SUPER_ADMIN', 'Super Administrator with full unrestricted control'),
  ('ADMIN', 'ADMIN', 'Standard Administrator with management access'),
  ('MODERATOR', 'MODERATOR', 'Content and Volunteer Moderator')
ON CONFLICT DO NOTHING;

-- SEED BASE PERMISSIONS
INSERT INTO permissions (key, module, description)
VALUES
  ('admin:all', 'system', 'Full administrative permission'),
  ('admin:read', 'system', 'View administrative dashboards and profiles'),
  ('admin:write', 'system', 'Manage administrative configurations and accounts'),
  ('donations:read', 'donations', 'View donation records and reports'),
  ('donations:write', 'donations', 'Manage donation records'),
  ('campaigns:manage', 'campaigns', 'Create, update, and manage campaigns'),
  ('volunteers:manage', 'volunteers', 'Review and manage volunteer applications')
ON CONFLICT DO NOTHING;

-- MAP SUPER_ADMIN ROLE TO admin:all PERMISSION
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.key = 'SUPER_ADMIN' AND p.key = 'admin:all'
ON CONFLICT DO NOTHING;

-- MAP ADMIN ROLE TO STANDARD PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.key = 'ADMIN' 
  AND p.key IN ('admin:read', 'admin:write', 'donations:read', 'donations:write', 'campaigns:manage', 'volunteers:manage')
ON CONFLICT DO NOTHING;
