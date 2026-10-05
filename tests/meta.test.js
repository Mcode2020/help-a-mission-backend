import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/team should return team members array', async () => {
  const response = await request(app).get('/api/team');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'success');
  assert.ok(Array.isArray(response.body.data));
  assert.ok(response.body.data.length > 0);
});

test('GET /api/impact should return impact summary and stories', async () => {
  const response = await request(app).get('/api/impact');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'success');
  assert.ok(response.body.data.summary);
  assert.ok(Array.isArray(response.body.data.stories));
});
