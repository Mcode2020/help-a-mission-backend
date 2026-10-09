import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/database/knex.client.js';

test('User Authentication APIs Integration Tests', async (t) => {
  const testUser = {
    fullName: 'Ananya Sharma',
    email: `ananya_${Date.now()}@example.com`,
    phone: `+9198${Math.floor(10000000 + Math.random() * 90000000)}`,
    password: 'SecurePassword123!',
    role: 'donor',
  };

  let sessionCookie = '';
  let authToken = '';

  t.after(async () => {
    // Cleanup created test users
    try {
      await db('users').where({ email: testUser.email }).del();
    } catch {
      // Cleanup ignored if DB not active in basic mode
    }
  });

  await t.test('1. POST /api/v1/auth/signup - Successfully registers new user', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(testUser);

    if (res.status === 500 && res.body?.message?.includes('connect ECONNREFUSED')) {
      t.skip('Database connection not available for integration test');
      return;
    }

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.user.id);
    assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
    assert.equal(res.body.data.user.name, testUser.fullName);
    assert.ok(res.body.data.token);

    const cookies = res.headers['set-cookie'];
    assert.ok(cookies, 'Should set user_session cookie');
    sessionCookie = cookies[0].split(';')[0];
    authToken = res.body.data.token;
  });

  await t.test('2. POST /api/v1/auth/signup - Rejects duplicate email', async () => {
    if (!authToken) return;

    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send(testUser);

    assert.equal(res.status, 409);
    assert.equal(res.body.success, false);
    assert.ok(res.body.error);
  });

  await t.test('3. POST /api/v1/auth/login - Authenticates with email and password', async () => {
    if (!authToken) return;

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: testUser.email,
        password: testUser.password,
        role: testUser.role,
        rememberMe: true
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.user);
    assert.ok(res.body.data.token);
  });

  await t.test('4. POST /api/v1/auth/login - Authenticates with phone and password', async () => {
    if (!authToken) return;

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: testUser.phone,
        password: testUser.password,
        role: testUser.role,
      });

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
  });

  await t.test('5. POST /api/v1/auth/login - Rejects invalid password', async () => {
    if (!authToken) return;

    const res = await request(app)
      .post('/api/v1/auth/login')
      .send({
        identifier: testUser.email,
        password: 'WrongPassword999!',
      });

    assert.equal(res.status, 401);
    assert.equal(res.body.success, false);
  });

  await t.test('6. GET /api/v1/auth/me - Retrieves current authenticated user profile', async () => {
    if (!sessionCookie) return;

    const res = await request(app)
      .get('/api/v1/auth/me')
      .set('Cookie', [sessionCookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.data.user.email, testUser.email.toLowerCase());
  });

  await t.test('7. POST /api/v1/auth/logout - Revokes user session', async () => {
    if (!sessionCookie) return;

    const res = await request(app)
      .post('/api/v1/auth/logout')
      .set('Cookie', [sessionCookie]);

    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });
});
