import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/campaigns should return campaigns list', async () => {
  const response = await request(app).get('/api/campaigns');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'success');
  assert.ok(Array.isArray(response.body.data));
  assert.ok(response.body.data.length > 0);
});

test('GET /api/campaigns/:id should return single campaign', async () => {
  const response = await request(app).get('/api/campaigns/camp-1');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'success');
  assert.strictEqual(response.body.data.id, 'camp-1');
});

test('GET /api/campaigns/:id with non-existent id should return 404', async () => {
  const response = await request(app).get('/api/campaigns/non-existent-id-999');
  assert.strictEqual(response.status, 404);
  assert.strictEqual(response.body.status, 'error');
});

test('POST /api/campaigns should create a new campaign', async () => {
  const newCamp = {
    title: 'Clean Drinking Water Initiative',
    category: 'Healthcare',
    summary: 'Installing RO water filtration plants in 3 villages',
    fullStory: 'Providing clean safe drinking water to rural households.',
    targetAmount: 150000,
    urgent: true
  };
  const response = await request(app).post('/api/campaigns').send(newCamp);
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.status, 'success');
  assert.strictEqual(response.body.data.title, 'Clean Drinking Water Initiative');
});
