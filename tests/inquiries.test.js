import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('POST /api/inquiries/contact with valid payload should return 201', async () => {
  const payload = {
    name: 'Sunil Dutt',
    email: 'sunil@example.com',
    phone: '9812345678',
    subject: 'General Question',
    message: 'I would like to know how to contribute ration bags.'
  };

  const response = await request(app).post('/api/inquiries/contact').send(payload);
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.status, 'success');
  assert.ok(response.body.data.id);
});

test('POST /api/inquiries/contact missing required field should return 400', async () => {
  const payload = {
    name: 'Sunil Dutt'
    // missing email & message
  };

  const response = await request(app).post('/api/inquiries/contact').send(payload);
  assert.strictEqual(response.status, 400);
  assert.strictEqual(response.body.status, 'error');
});

test('POST /api/inquiries/volunteer with valid payload should return 201', async () => {
  const payload = {
    name: 'Pooja Rani',
    email: 'pooja@example.com',
    phone: '9876501234',
    skills: ['Teaching', 'Social Media'],
    motivation: 'Want to help rural youth learn basic computer skills'
  };

  const response = await request(app).post('/api/inquiries/volunteer').send(payload);
  assert.strictEqual(response.status, 201);
  assert.strictEqual(response.body.status, 'success');
  assert.ok(response.body.data.id);
});
