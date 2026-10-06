# 08 — Security, File Boundaries & Operations Specification

**Project:** Help A Mission Welfare Society — Backend API  
**Target Platform:** Namecheap cPanel + PostgreSQL + Express.js  

---

## 1. File Storage Isolation Architecture

To prevent unauthorized file exposure, public and private uploads utilize distinct service abstractions backed by strict filesystem boundaries.

```text
                               ┌─────────────────────────┐
                               │  Express API Controller │
                               └────────────┬────────────┘
                                            │
                    ┌───────────────────────┴───────────────────────┐
                    ▼                                               ▼
     ┌─────────────────────────────┐                 ┌─────────────────────────────┐
     │  PublicFileStorageService   │                 │  PrivateFileStorageService  │
     └──────────────┬──────────────┘                 └──────────────┬──────────────┘
                    │                                               │
                    ▼                                               ▼
┌───────────────────────────────────────┐       ┌───────────────────────────────────────┐
│ /home/<account>/public_files/          │       │ /home/<account>/storage/private/      │
│ (Web Root for files.example.org)      │       │ (OUTSIDE Web Root - Node Stream Only) │
└───────────────────────────────────────┘       └───────────────────────────────────────┘
```

### 1.1 Storage Rules Matrix

| Criteria | Public Upload Service (`PublicFileStorageService`) | Private Upload Service (`PrivateFileStorageService`) |
| :--- | :--- | :--- |
| **Storage Root** | Configured via `PUBLIC_UPLOAD_ROOT` (`/home/<account>/public_files`) | Configured via `PRIVATE_UPLOAD_ROOT` (`/home/<account>/storage/private`) |
| **Web Accessibility** | Accessible directly via browser URL (`https://files.example.org/...`) | **NEVER** accessible via web server URL |
| **Delivery Method** | Direct web server static delivery (Apache / Nginx) | Express API streaming endpoint with session & RBAC check |
| **Allowed File Types** | `image/jpeg`, `image/png`, `image/webp`, `application/pdf` | `application/pdf`, `text/csv`, `application/json` |
| **Filename Generation**| Random UUID + Extension (`23f8a91b-4c12.jpg`) | Random UUID + Extension (`8f12a9bc-9912.pdf`) |
| **Path Traversal Check**| `assertInDirectory(targetPath, PUBLIC_UPLOAD_ROOT)` | `assertInDirectory(targetPath, PRIVATE_UPLOAD_ROOT)` |

### 1.2 Path Traversal Prevention Implementation
```javascript
import path from 'node:path';

export function assertInDirectory(filePath, rootDirectory) {
  const resolvedPath = path.resolve(filePath);
  const resolvedRoot = path.resolve(rootDirectory);
  
  if (!resolvedPath.startsWith(resolvedRoot + path.sep)) {
    throw new Error('SECURITY_VIOLATION: Path traversal attempt detected.');
  }
  return resolvedPath;
}
```

---

## 2. PII Protection & Log Redaction Standard

Structured logger middleware (`src/security/logger.js`) redacts all sensitive credential, financial, and personal fields before writing log output:

```javascript
const SENSITIVE_KEYS = new Set([
  'password', 'password_hash', 'mfa_secret', 'secret',
  'razorpay_secret', 'webhook_secret', 'authorization', 'cookie',
  'card_number', 'cvv', 'otp', 'token'
]);

export function redactSensitiveData(data) {
  if (!data || typeof data !== 'object') return data;
  
  const redacted = Array.isArray(data) ? [] : {};
  for (const [key, value] of Object.entries(data)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      redacted[key] = '[REDACTED]';
    } else if (typeof value === 'object') {
      redacted[key] = redactSensitiveData(value);
    } else {
      redacted[key] = value;
    }
  }
  return redacted;
}
```

---

## 3. Mandatory Audit Events

The `audit_events` table captures all privileged operational actions:

```sql
INSERT INTO audit_events (
  request_id, actor_type, actor_id, action, entity_type, entity_id, before_redacted, after_redacted, device_id, ip_address
) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10);
```

### Mandatory Audited Actions
- Admin authentication (Login, Logout, Failed Attempt, MFA Challenge)
- Dynamic RBAC modifications (Role Created, Role Assigned, Permission Override Applied)
- Content publishing (CMS Section Published, Initiative Published)
- Financial exports (CSV/PDF Financial Report Generated)
- Private document downloads (Private Receipt/Report Downloaded)
- System settings changes (Reminder schedule updated)

---

## 4. Production Hardening Checklist

- [ ] **Secret Injection:** Production secrets passed strictly via environment/platform secrets, never stored in `.env` on server.
- [ ] **Startup Validation:** `src/config/env.js` validates all environment variables and halts process on error.
- [ ] **CORS Allowlist:** Origin restricted exclusively to domain names `https://helpamission.org` and `https://admin.helpamission.org`.
- [ ] **Security Headers:** `helmet` enabled with strict CSP, HSTS, `X-Content-Type-Options: nosniff`, and frameguard.
- [ ] **Database Least Privilege:** Application DB user lacks DDL privileges in production; standard runtime limited to DML (`SELECT`, `INSERT`, `UPDATE`).
- [ ] **Script Execution Disabled:** Apache/cPanel `.htaccess` rules inside `public_files/` prevent execution of `.php`, `.cgi`, or `.sh` files.
