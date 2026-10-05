import test from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import app from '../src/app.js';

test('GET /api/campaigns returns active campaigns list', async () => {
  const res = await request(app).get('/api/campaigns');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'success');
  assert.ok(Array.isArray(res.body.data));
  assert.ok(res.body.data.length > 0);
  assert.strictEqual(res.body.data[0].slug, 'blood-donation-camps');
});

test('GET /api/campaigns/:slug returns single campaign detail', async () => {
  const res = await request(app).get('/api/campaigns/blood-donation-camps');
  assert.strictEqual(res.status, 200);
  assert.strictEqual(res.body.status, 'success');
  assert.strictEqual(res.body.data.slug, 'blood-donation-camps');
  assert.ok(res.body.data.progressPercent >= 0);
});

test('GET /api/campaigns/invalid-slug returns 404', async () => {
  const res = await request(app).get('/api/campaigns/non-existent-campaign');
  assert.strictEqual(res.status, 404);
});

test('POST /api/donations/create-order creates Razorpay simulation order', async () => {
  const res = await request(app)
    .post('/api/donations/create-order')
    .send({
      amount: 1000,
      donorName: 'Aarav Sharma',
      email: 'aarav@example.com',
      phone: '9876543210',
      pan: 'ABCDE1234F',
      frequency: 'once',
      campaignId: 'blood-donation-camps',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.status, 'success');
  assert.ok(res.body.data.donationId);
  assert.ok(res.body.data.orderId);
  assert.strictEqual(res.body.data.amount, 100000); // 1000 * 100 paise
});

test('POST /api/donations/verify validates simulated signature', async () => {
  // First create order
  const orderRes = await request(app)
    .post('/api/donations/create-order')
    .send({
      amount: 500,
      donorName: 'Priya Verma',
      email: 'priya@example.com',
      phone: '9812345678',
    });

  const { donationId, orderId } = orderRes.body.data;
  const paymentId = 'pay_test_123456';
  const signature = `sim_sig_${orderId}_${paymentId}`;

  const verifyRes = await request(app)
    .post('/api/donations/verify')
    .send({
      donationId,
      orderId,
      paymentId,
      signature,
    });

  assert.strictEqual(verifyRes.status, 200);
  assert.strictEqual(verifyRes.body.status, 'success');
  assert.ok(verifyRes.body.receipt.certificate80G);
});

test('POST /api/volunteers registers volunteer application', async () => {
  const res = await request(app)
    .post('/api/volunteers')
    .send({
      fullName: 'Vikram Singh',
      email: 'vikram@example.com',
      phone: '9822334455',
      city: 'Jind',
      skills: 'First Aid & Logistics',
      availability: 'Weekends',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.status, 'success');
  assert.ok(res.body.applicationId);
});

test('POST /api/contact records visitor inquiry', async () => {
  const res = await request(app)
    .post('/api/contact')
    .send({
      fullName: 'Sunita Rani',
      email: 'sunita@example.com',
      phone: '9833445566',
      subject: 'Inquiry regarding blood camp schedule',
      message: 'Hello, when is the next camp scheduled in Jind sector 7?',
    });

  assert.strictEqual(res.status, 201);
  assert.strictEqual(res.body.status, 'success');
  assert.ok(res.body.inquiryId);
});
