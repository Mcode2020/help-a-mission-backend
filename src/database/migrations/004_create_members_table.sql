-- Migration 004: Create Members Table and Seed Members Permissions

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NULL,
  phone VARCHAR(32) NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT NULL,
  image_url TEXT NULL,
  status VARCHAR(32) NOT NULL DEFAULT 'published',
  language VARCHAR(10) NOT NULL DEFAULT 'en',
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMPTZ NULL
);

-- SEED MEMBERS PERMISSIONS
INSERT INTO permissions (key, module, description)
VALUES
  ('members:read', 'members', 'View NGO members list and profile details'),
  ('members:write', 'members', 'Create, update, and manage NGO members')
ON CONFLICT DO NOTHING;

-- MAP SUPER_ADMIN ROLE TO MEMBERS PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.key = 'SUPER_ADMIN' AND p.key IN ('members:read', 'members:write')
ON CONFLICT DO NOTHING;

-- MAP ADMIN ROLE TO MEMBERS PERMISSIONS
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id 
FROM roles r, permissions p 
WHERE r.key = 'ADMIN' AND p.key IN ('members:read', 'members:write')
ON CONFLICT DO NOTHING;

-- SEED MEMBERS CMS PAGE RECORD
INSERT INTO cms_pages (slug, title, status)
VALUES ('members', 'Members Page', 'published')
ON CONFLICT (slug) DO NOTHING;

