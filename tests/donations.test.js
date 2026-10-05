import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('POST /api/donations with valid data should create donation', async () => {
  const donationPayload = {
    donorName: 'Vikram Singh',
    email: 'vikram@example.com',
    phone: '9876543210',
    amount: 2500,
    campaignId: 'camp-1',
    paymentMethod: 'upi',
    requires80G: false
  };

  const response = await request(app).post('/api/donations').send(donationPayload);
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.status, 'success');
  assert.ok(response.body.data.transactionId);
  assert.strictEqual(response.body.data.amount, 2500);
});

test('POST /api/donations with invalid email should fail with 400', async () => {
  const payload = {
    donorName: 'Test',
    email: 'not-an-email',
    amount: 1000
  };

  const response = await request(app).post('/api/donations').send(payload);
  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.status, 'error');
});

test('POST /api/donations with invalid PAN should fail when 80G requested', async () => {
  const payload = {
    donorName: 'Test Donor',
    email: 'test@example.com',
    amount: 1000,
    requires80G: true,
    panNumber: 'INVALID_PAN_123'
  };

  const response = await request(app).post('/api/donations').send(payload);
  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.status, 'error');
});

test('GET /api/donations/recent should return public donations list', async () => {
  const response = await request(app).get('/api/donations/recent');
  assert.strictEqual(response.status, 200);
  assert.strictEqual(response.body.status, 'success');
  assert.ok(Array.isArray(response.body.data));
});
