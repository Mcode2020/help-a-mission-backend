import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('GET / should return 200 and success status', async () => {
  const response = await request(app).get('/');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'success');
});

test('GET /api/health should return 200 and health payload', async () => {
  const response = await request(app).get('/api/health');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'success');
  assert.ok(response.body.database);
  assert.ok(response.body.timestamp);
});

test('GET /unknown-route should return 404', async () => {
  const response = await request(app).get('/unknown-route');
  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.body.status, 'error');
});
