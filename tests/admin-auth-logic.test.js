import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hashPassword, verifyPassword, generateSessionToken, hashSessionToken } from '../src/utils/crypto.js';
import { adminAuthValidation } from '../src/modules/admin-auth/admin-auth.validation.js';
import { ApiError } from '../src/utils/api-error.js';
import { authorize } from '../src/middleware/authorize.js';

describe('Argon2id Password & Session Hashing Logic', () => {
  it('should correctly hash and verify password using Argon2id', async () => {
    const rawPassword = 'SuperSecureAdminPassword123!';
    const hash = await hashPassword(rawPassword);

    assert.ok(hash.startsWith('$argon2id$'), 'Hash should be Argon2id format');

    const isValid = await verifyPassword(hash, rawPassword);
    assert.strictEqual(isValid, true, 'Valid password should verify successfully');

    const isInvalid = await verifyPassword(hash, 'WrongPassword!');
    assert.strictEqual(isInvalid, false, 'Invalid password should fail verification');
  });

  it('should generate 64-char hex session token and derive SHA-256 hash', () => {
    const rawToken = generateSessionToken();
    assert.strictEqual(rawToken.length, 64, 'Raw session token should be 64 characters');

    const tokenHash = hashSessionToken(rawToken);
    assert.strictEqual(tokenHash.length, 64, 'SHA-256 token hash should be 64 characters');
    assert.notStrictEqual(rawToken, tokenHash, 'Raw token and token hash must differ');
  });
});

describe('Admin Auth Validation', () => {
  it('should validate valid email and password', () => {
    const input = { email: '  Admin@HelpAMission.org ', password: 'Password123!' };
    const validated = adminAuthValidation.validateLogin(input);
    assert.strictEqual(validated.email, 'admin@helpamission.org');
    assert.strictEqual(validated.password, 'Password123!');
  });

  it('should throw ApiError for invalid email', () => {
    assert.throws(() => {
      adminAuthValidation.validateLogin({ email: 'invalid-email', password: 'Password123!' });
    }, (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'INVALID_EMAIL');
  });

  it('should throw ApiError for short password', () => {
    assert.throws(() => {
      adminAuthValidation.validateLogin({ email: 'admin@helpamission.org', password: '123' });
    }, (err) => err instanceof ApiError && err.statusCode === 400 && err.code === 'INVALID_PASSWORD');
  });
});

describe('Authorize Middleware Logic', () => {
  it('should grant access to SUPER_ADMIN role', () => {
    const req = { admin: { role: 'SUPER_ADMIN', permissions: [] } };
    let called = false;
    const next = () => { called = true; };

    const middleware = authorize('donations:read');
    middleware(req, {}, next);

    assert.strictEqual(called, true, 'SUPER_ADMIN should bypass permission checks');
  });

  it('should grant access if admin has specific permission', () => {
    const req = { admin: { role: 'ADMIN', permissions: ['donations:read', 'donations:write'] } };
    let called = false;
    const next = () => { called = true; };

    const middleware = authorize('donations:read');
    middleware(req, {}, next);

    assert.strictEqual(called, true, 'Admin with permission should be authorized');
  });

  it('should deny access if admin lacks required permission', () => {
    const req = { admin: { role: 'MODERATOR', permissions: ['volunteers:manage'] } };
    let errorPassed = null;
    const next = (err) => { errorPassed = err; };

    const middleware = authorize('admin:write');
    middleware(req, {}, next);

    assert.ok(errorPassed instanceof ApiError);
    assert.strictEqual(errorPassed.statusCode, 403);
    assert.strictEqual(errorPassed.code, 'INSUFFICIENT_PERMISSIONS');
  });
});
