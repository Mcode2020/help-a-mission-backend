-- Migration 001: Initial Schema for Admin Authentication & RBAC

CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. ROLES TABLE
CREATE TABLE IF NOT EXISTS roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. PERMISSIONS TABLE
CREATE TABLE IF NOT EXISTS permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. ROLE_PERMISSIONS JOIN TABLE
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (role_id, permission_id)
);

-- 4. ADMINS TABLE
CREATE TABLE IF NOT EXISTS admins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  full_name VARCHAR(255) NOT NULL,
  role_id UUID NOT NULL REFERENCES roles(id) ON DELETE RESTRICT,
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_accessed_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- INDEXES FOR OPTIMAL QUERY PERFORMANCE
CREATE INDEX IF NOT EXISTS idx_admins_email ON admins(email);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_token_hash ON admin_sessions(session_token_hash);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_admin_id ON admin_sessions(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_expires_at ON admin_sessions(expires_at);

-- SEED BASE ROLES
INSERT INTO roles (name, description)
VALUES 
  ('SUPER_ADMIN', 'Super Administrator with full unrestricted control'),
  ('ADMIN', 'Standard Administrator with management access'),
  ('MODERATOR', 'Content and Volunteer Moderator')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- SEED BASE PERMISSIONS
INSERT INTO permissions (name, description)
VALUES
  ('admin:all', 'Full administrative permission'),
  ('admin:read', 'View administrative dashboards and profiles'),
  ('admin:write', 'Manage administrative configurations and accounts'),
  ('donations:read', 'View donation records and reports'),
  ('donations:write', 'Manage donation records'),
  ('campaigns:manage', 'Create, update, and manage campaigns'),
  ('volunteers:manage', 'Review and manage volunteer applications')
ON CONFLICT (name) DO UPDATE SET description = EXCLUDED.description;

-- MAP SUPER_ADMIN ROLE TO admin:all PERMISSION
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'SUPER_ADMIN' AND p.name = 'admin:all'
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- MAP ADMIN ROLE TO STANDARD PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.name = 'ADMIN' 
  AND p.name IN ('admin:read', 'admin:write', 'donations:read', 'donations:write', 'campaigns:manage', 'volunteers:manage')
ON CONFLICT (role_id, permission_id) DO NOTHING;
