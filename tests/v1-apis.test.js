import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';
import db from '../src/database/knex.client.js';
import { AdminModel } from '../src/database/models/admin.model.js';

test('NGO API v1 Complete Endpoints Integration Test Suite', async (t) => {
  let sessionCookie = '';

  t.before(async () => {
    try {
      await AdminModel.createAdmin({
        email: 'admin@helpamission.org',
        password: 'SuperAdminPassword123!',
        roleKeys: ['super_admin'],
      });
    } catch {
      // Ignored if already exists
    }

    // Authenticate admin to acquire session cookie
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: 'admin@helpamission.org',
        password: 'SuperAdminPassword123!',
      });

    const cookies = loginRes.headers['set-cookie'];
    if (cookies) {
      sessionCookie = cookies[0].split(';')[0];
    }
  });

  t.after(async () => {
    await db.destroy();
  });

  await t.test('1. Public CMS Home Endpoint returns homepage structure', async () => {
    const res = await request(app).get('/api/v1/public/home');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.slug);
  });

  await t.test('2. Public Initiatives Endpoint returns list', async () => {
    const res = await request(app).get('/api/v1/public/initiatives');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test('3. Public Gallery Endpoint returns gallery list', async () => {
    const res = await request(app).get('/api/v1/public/gallery');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
  });

  await t.test('4. Public Members Endpoint returns published members list and pagination', async () => {
    const res = await request(app).get('/api/v1/public/members');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.meta.pagination);
  });

  await t.test('4. POST /api/v1/donations/order creates donation order with Idempotency-Key', async () => {
    const idempotencyKey = `idemp_${Date.now()}`;

    const res = await request(app)
      .post('/api/v1/donations/order')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        amountMinor: 100000,
        currency: 'INR',
        donorName: 'Rahul Verma',
        donorEmail: 'rahul@example.com',
        donorPhone: '+919876543210',
        message: 'Support healthcare',
      });

    assert.equal(res.status, 201);
    assert.equal(res.body.success, true);
    assert.ok(res.body.data.donationId);
    assert.ok(res.body.data.razorpayOrderId);
    assert.equal(res.body.data.amountMinor, 100000);

    // Replaying with same Idempotency-Key returns exact same order
    const replayRes = await request(app)
      .post('/api/v1/donations/order')
      .set('Idempotency-Key', idempotencyKey)
      .send({
        amountMinor: 100000,
        currency: 'INR',
        donorName: 'Rahul Verma',
        donorEmail: 'rahul@example.com',
      });

    assert.equal(replayRes.status, 200);
    assert.equal(replayRes.body.data.donationId, res.body.data.donationId);
  });

  await t.test('5. Admin RBAC Permissions & Roles Endpoints', async () => {
    const permsRes = await request(app)
      .get('/api/v1/admin/rbac/permissions')
      .set('Cookie', [sessionCookie]);

    assert.equal(permsRes.status, 200);
    assert.equal(permsRes.body.success, true);
    assert.ok(permsRes.body.data.permissions.length >= 15);

    const rolesRes = await request(app)
      .get('/api/v1/admin/rbac/roles')
      .set('Cookie', [sessionCookie]);

    assert.equal(rolesRes.status, 200);
    assert.equal(rolesRes.body.success, true);
    assert.ok(rolesRes.body.data.roles.length >= 3);
  });

  await t.test('6. Admin Dashboard Summary & Export Endpoints', async () => {
    const dashRes = await request(app)
      .get('/api/v1/admin/dashboard')
      .set('Cookie', [sessionCookie]);

    assert.equal(dashRes.status, 200);
    assert.equal(dashRes.body.success, true);
    assert.ok(dashRes.body.data.grossAmountMinor >= 0);

    const exportRes = await request(app)
      .post('/api/v1/admin/reports/export')
      .set('Cookie', [sessionCookie])
      .send({ format: 'csv' });

    assert.equal(exportRes.status, 201);
    assert.equal(exportRes.body.success, true);
    assert.ok(exportRes.body.data.relativePath);
  });
});
