import test from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import app from '../src/app.js';

test('Health Endpoints Test Suite', async (t) => {
  await t.test('GET / should return 200 and success status', async () => {
    const res = await request(app).get('/');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
  });

  await t.test('GET /api/v1/health should return 200 and health payload', async () => {
    const res = await request(app).get('/api/v1/health');
    assert.equal(res.status, 200);
    assert.equal(res.body.success, true);
    assert.equal(res.body.status, 'UP');
  });

  await t.test('GET /unknown-route should return 404', async () => {
    const res = await request(app).get('/unknown-route');
    assert.equal(res.status, 404);
    assert.equal(res.body.success, false);
  });
});
