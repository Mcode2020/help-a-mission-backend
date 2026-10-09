# 06 — Authentication, RBAC & Session Security Specification

**Project:** Help A Mission Welfare Society — Backend API  
**Architecture:** Server-Side Opaque Sessions + Permissions-First RBAC  

---

## 1. Authentication Lifecycle

```mermaid
graph TD
    subgraph Admin Account Ingestion
        CLI[Server Operator] -->|npm run admin:create| DB[(PostgreSQL)]
    end

    subgraph Admin Login Flow
        Admin[Admin User] -->|POST /admin/auth/login| API[Express API]
        API -->|Verify Argon2id Hash| DB
        alt Password Valid & MFA Enabled
            API-->>Admin: Return HTTP 202 (Requires TOTP Challenge)
            Admin -->|POST /admin/auth/mfa/verify| API
            API -->|Verify TOTP Token| DB
            API-->>Admin: Issue HttpOnly Session Cookie
        else Password Valid & MFA Disabled
            API-->>Admin: Issue HttpOnly Session Cookie
        end
    end
```

---

## 2. Admin Lifecycle Security Rules

1. **No Public Admin Registration:** There is no HTTP endpoint for creating admin accounts. Admin accounts must be created using the trusted local command:
   ```bash
   node dist/scripts/create-admin.js --email="admin@helpamission.org"
   ```
   Password entry is interactively prompted (hidden terminal input). Passwords must never be passed as CLI flags.
2. **Password Hashing:** Passwords are hashed using **Argon2id** (`argon2` module) with parameters:
   - Time cost: `3`
   - Memory cost: `65536` (64 MB)
   - Parallelism: `4`
3. **Mandatory TOTP MFA:** Every admin must configure Time-based One-Time Password (TOTP) MFA using standard authenticator apps (Google Authenticator, Authy). TOTP secrets are encrypted at rest (`mfa_secret_encrypted`).
4. **Session Cookie Directives:**
   - Cookie Name: `__Host-admin_session` (Production) / `admin_session` (Dev)
   - Parameters: `HttpOnly = true`, `Secure = true`, `SameSite = Strict`, `Path = /`
   - Idle Timeout: 30 minutes
   - Absolute Lifetime: 12 hours

---

## 3. Permissions-First RBAC Architecture

### 3.1 Permission Registry Contract
Backend routes check permissions, **never** hardcoded role strings (`"admin"`, `"editor"`).

```javascript
// GOOD (Permission-based)
router.get('/reports', requirePermission('reports:read'), getReportsController);

// BAD (Hardcoded Role Check - FORBIDDEN)
if (req.user.role === 'admin') { ... }
```

### 3.2 Authoritative Permission Registry (`permissions` table)

| Permission Key | Module | Description |
| :--- | :--- | :--- |
| `cms:read` | CMS | View CMS pages and section drafts |
| `cms:write` | CMS | Create or edit CMS section content |
| `cms:publish` | CMS | Publish CMS drafts to live homepage |
| `initiatives:write` | CMS | Create or edit initiative pages |
| `gallery:write` | CMS | Upload and organize gallery items |
| `donors:read` | Donors | View donor profiles and donation history |
| `donations:read` | Financials | View donation transaction records |
| `reports:read` | Analytics | Access financial summary dashboard |
| `reports:export` | Analytics | Export CSV/PDF financial reports |
| `files:private_read`| Files | Stream private internal documents |
| `security:read` | Security | View security logs and active sessions |
| `security:write` | Security | Revoke active admin sessions |
| `rbac:read` | RBAC | View dynamic roles and assignments |
| `rbac:write` | RBAC | Create roles and update permissions |
| `rbac:assign` | RBAC | Assign roles to admin accounts |

---

## 4. RBAC Permission Resolution Algorithm

For every authenticated request, effective permissions are resolved dynamically:

```javascript
export async function resolveAdminPermissions(adminId, pool) {
  // 1. Fetch active roles assigned to admin
  // 2. Fetch all permissions associated with those roles
  // 3. Fetch admin_permission_overrides for this adminId
  // 4. Compute: (Role Permissions UNION Allow Overrides) MINUS Deny Overrides
  
  const query = `
    WITH role_perms AS (
      SELECT p.key 
      FROM admin_roles ar
      JOIN role_permissions rp ON ar.role_id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      JOIN roles r ON ar.role_id = r.id
      WHERE ar.admin_id = $1 AND r.is_active = true AND p.is_active = true
    ),
    overrides AS (
      SELECT p.key, apo.effect 
      FROM admin_permission_overrides apo
      JOIN permissions p ON apo.permission_id = p.id
      WHERE apo.admin_id = $1 AND p.is_active = true
    )
    SELECT key FROM role_perms WHERE key NOT IN (SELECT key FROM overrides WHERE effect = 'deny')
    UNION
    SELECT key FROM overrides WHERE effect = 'allow';
  `;
  
  const { rows } = await pool.query(query, [adminId]);
  return new Set(rows.map(r => r.key));
}
```

### 4.5 Session Cache Invalidation (`authz_version`)
When an admin's assigned roles or permissions change, `admins.authz_version` is incremented. Session verification middleware checks `session.authz_version === admin.authz_version`. On mismatch, the session authorization cache is instantly invalidated.
