import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/database/knex.client.js';
import { AdminModel } from '../src/database/models/admin.model.js';

test('Admin Auth API v1 Endpoint Integration Suite', async (t) => {
  let sessionCookie = '';

  t.before(async () => {
    // Ensure test admin exists
    try {
      await AdminModel.createAdmin({
        email: 'admin@helpamission.org',
        password: 'SuperAdminPassword123!',
        roleKeys: ['super_admin'],
      });
    } catch {
      // Ignored if already exists
    }
  });

  t.after(async () => {
    await db.destroy();
  });

  await t.test('POST /api/v1/admin/auth/login succeeds with valid Super Admin credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: 'admin@helpamission.org',
        password: 'SuperAdminPassword123!',
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.admin);
    assert.equal(res.body.data.admin.email, 'admin@helpamission.org');

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Set-Cookie header should be present');
    sessionCookie = cookies[0].split(';')[0];
  });

  await t.test('POST /api/v1/admin/auth/login fails with invalid credentials', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: 'admin@helpamission.org',
        password: 'WrongPassword!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
    assert.equal(res.body.error.code, 'INVALID_CREDENTIALS');
  });

  await t.test('GET /api/v1/admin/auth/me returns current admin profile', async () => {
    const res = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', [sessionCookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.admin.email, 'admin@helpamission.org');
    assert.ok(Array.isArray(res.body.data.admin.permissions));
  });

  await t.test('POST /api/v1/admin/auth/refresh rotates session token and returns updated session', async () => {
    const oldCookie = sessionCookie;

    const res = await request(app)
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', [oldCookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.expiresAt);
    assert.equal(res.body.data.admin.email, 'admin@helpamission.org');

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Set-Cookie header must be issued on session refresh');
    const newSessionCookie = cookies[0].split(';')[0];
    assert.notEqual(newSessionCookie, oldCookie, 'New session cookie must differ from rotated old cookie');

    // Update active session cookie for subsequent requests
    sessionCookie = newSessionCookie;

    // Authenticate with new refreshed session cookie
    const resMe = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', [sessionCookie]);

    assert.equal(resMe.status, 200);
    assert.equal(resMe.body.data.admin.email, 'admin@helpamission.org');

    // Using the old rotated token should now fail with 401
    const resOldTokenMe = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', [oldCookie]);

    assert.equal(resOldTokenMe.status, 401);
  });

  await t.test('POST /api/v1/admin/auth/refresh fails without valid session', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', ['admin_session=invalid_token_1234567890']);

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('POST /api/v1/admin/auth/logout revokes session', async () => {
    const res = await request(app)
      .post('/api/v1/admin/auth/logout')
      .set('Cookie', [sessionCookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);

    // Try accessing /me again - should fail 401
    const resMe = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', [sessionCookie]);

    assert.equal(resMe.status, 401);
  });
});
