import request from 'supertest';
import app from '../app.js';
import db from '../database/knex.client.js';
import { AdminModel } from '../database/models/admin.model.js';

async function runWarmup() {
  console.log('====================================================');
  console.log('🚀 WARM-UP & AUTHENTICATION FLOW VERIFICATION');
  console.log('====================================================\n');

  try {
    // 1. Ensure Super Admin account exists
    console.log('[Step 1] Ensuring Super Admin account (admin@helpamission.org)...');
    try {
      await AdminModel.createAdmin({
        email: 'admin@helpamission.org',
        password: 'SuperAdminPassword123!',
        roleKeys: ['super_admin'],
      });
      console.log('  ✔ Super Admin account created.');
    } catch {
      console.log('  ✔ Super Admin account already exists.');
    }

    // 2. Perform Super Admin Login
    console.log('\n[Step 2] Testing Super Admin Login (POST /api/v1/admin/auth/login)...');
    const loginRes = await request(app)
      .post('/api/v1/admin/auth/login')
      .send({
        email: 'admin@helpamission.org',
        password: 'SuperAdminPassword123!',
      });

    if (loginRes.status === 200 && loginRes.body.success) {
      console.log('  ✔ Login Status:', loginRes.status, 'OK');
      console.log('  ✔ Admin Email:', loginRes.body.data.admin.email);
      console.log('  ✔ Admin Role:', loginRes.body.data.admin.role);
      console.log('  ✔ Permissions Count:', loginRes.body.data.admin.permissions.length);
    } else {
      throw new Error(`Login failed with status ${loginRes.status}: ${JSON.stringify(loginRes.body)}`);
    }

    const setCookieHeaders = loginRes.headers['set-cookie'];
    if (!setCookieHeaders || setCookieHeaders.length === 0) {
      throw new Error('No Set-Cookie header returned from login response!');
    }

    const initialCookie = setCookieHeaders[0].split(';')[0];
    console.log('  ✔ Session Cookie Issued:', initialCookie.substring(0, 30) + '...');

    // 3. Verify Profile Endpoint (/me)
    console.log('\n[Step 3] Verifying Authenticated Profile (GET /api/v1/admin/auth/me)...');
    const meRes = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', [initialCookie]);

    if (meRes.status === 200 && meRes.body.success) {
      console.log('  ✔ Profile Status:', meRes.status, 'OK');
      console.log('  ✔ Authenticated User:', meRes.body.data.admin.email);
    } else {
      throw new Error(`Profile query failed with status ${meRes.status}`);
    }

    // 4. Test Session Refresh & Token Rotation
    console.log('\n[Step 4] Verifying Session Refresh API (POST /api/v1/admin/auth/refresh)...');
    const refreshRes = await request(app)
      .post('/api/v1/admin/auth/refresh')
      .set('Cookie', [initialCookie]);

    if (refreshRes.status === 200 && refreshRes.body.success) {
      console.log('  ✔ Refresh Status:', refreshRes.status, 'OK');
      console.log('  ✔ Refreshed Session Expiry:', refreshRes.body.data.expiresAt);
    } else {
      throw new Error(`Session refresh failed with status ${refreshRes.status}: ${JSON.stringify(refreshRes.body)}`);
    }

    const refreshedCookieHeaders = refreshRes.headers['set-cookie'];
    if (!refreshedCookieHeaders || refreshedCookieHeaders.length === 0) {
      throw new Error('No Set-Cookie header returned on session refresh!');
    }

    const refreshedCookie = refreshedCookieHeaders[0].split(';')[0];
    console.log('  ✔ Refreshed Cookie Issued:', refreshedCookie.substring(0, 30) + '...');
    if (refreshedCookie === initialCookie) {
      throw new Error('Refreshed token is identical to old token! Token rotation failed.');
    }
    console.log('  ✔ Token Rotation Verified (New token differs from old token).');

    // 5. Test Access with New Refreshed Cookie
    console.log('\n[Step 5] Accessing Profile with Refreshed Cookie...');
    const newMeRes = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', [refreshedCookie]);

    if (newMeRes.status === 200 && newMeRes.body.success) {
      console.log('  ✔ Access with Refreshed Cookie Succeeded (200 OK).');
    } else {
      throw new Error('Access with refreshed cookie failed!');
    }

    // 6. Confirm Old Rotated Cookie is Revoked
    console.log('\n[Step 6] Testing Old Rotated Cookie Revocation...');
    const oldCookieRes = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', [initialCookie]);

    if (oldCookieRes.status === 401) {
      console.log('  ✔ Old Cookie Revocation Verified (Returned 401 Unauthorized as expected).');
    } else {
      throw new Error(`Old cookie was not revoked! Returned status ${oldCookieRes.status}`);
    }

    // 7. Perform Logout
    console.log('\n[Step 7] Testing Admin Logout (POST /api/v1/admin/auth/logout)...');
    const logoutRes = await request(app)
      .post('/api/v1/admin/auth/logout')
      .set('Cookie', [refreshedCookie]);

    if (logoutRes.status === 200 && logoutRes.body.success) {
      console.log('  ✔ Logout Status:', logoutRes.status, 'OK');
    } else {
      throw new Error('Logout failed!');
    }

    // 8. Post-Logout Access Verification
    console.log('\n[Step 8] Verifying Access Post-Logout...');
    const postLogoutRes = await request(app)
      .get('/api/v1/admin/auth/me')
      .set('Cookie', [refreshedCookie]);

    if (postLogoutRes.status === 401) {
      console.log('  ✔ Post-Logout Protection Verified (Returned 401 Unauthorized as expected).');
    } else {
      throw new Error(`Post-logout request returned ${postLogoutRes.status} instead of 401!`);
    }

    console.log('\n====================================================');
    console.log('🎉 ALL WARM-UP & AUTHENTICATION CHECKS PASSED SUCCESSFULLY!');
    console.log('====================================================');
  } catch (error) {
    console.error('\n✖ WARM-UP FAILED:', error.message);
    process.exitCode = 1;
  } finally {
    await db.destroy();
  }
}

runWarmup();
