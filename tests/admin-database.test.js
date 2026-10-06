import test from 'node:test';
import assert from 'node:assert/strict';
import db from '../src/database/knex.client.js';
import { AdminRepository, RoleRepository, PermissionRepository } from '../src/database/repositories/index.js';
import { AdminModel, RoleModel } from '../src/database/models/index.js';

const adminRepo = new AdminRepository();
const roleRepo = new RoleRepository();
const permRepo = new PermissionRepository();

test('Admin & RBAC Database Model & Repository Integration Tests', async (t) => {
  t.after(async () => {
    await db.destroy();
  });

  await t.test('1. System permissions and roles are properly seeded', async () => {
    const permissions = await permRepo.getAllActive();
    assert.ok(permissions.length >= 15, `At least 15 default permissions should be present (found ${permissions.length})`);

    const superAdminRole = await roleRepo.findByKey('super_admin');
    assert.ok(superAdminRole, 'super_admin role must exist');
    assert.equal(superAdminRole.is_system, true);
  });

  await t.test('2. AdminModel.authenticate verifies password and returns resolved permissions', async () => {
    try {
      // Ensure test admin exists
      let testAdmin = await adminRepo.findByEmailNormalized('admin@helpamission.org');
      if (!testAdmin) {
        testAdmin = await AdminModel.createAdmin({
          email: 'admin@helpamission.org',
          password: 'SuperAdminPassword123!',
          roleKeys: ['super_admin'],
        });
      }

      const authResult = await AdminModel.authenticate({
        email: 'admin@helpamission.org',
        password: 'SuperAdminPassword123!',
        deviceId: 'test_device_001',
        userAgent: 'NodeTestRunner',
        ipAddress: '127.0.0.1',
      });

      assert.equal(authResult.success, true, `Auth failed: ${JSON.stringify(authResult)}`);
      assert.equal(authResult.mfaRequired, false);
      assert.ok(authResult.token, 'Session raw token should be issued');

      const validSession = await AdminModel.validateSession(authResult.token);
      assert.ok(validSession, 'Session should be valid');
      assert.equal(validSession.admin.email, 'admin@helpamission.org');
      assert.ok(validSession.permissions.has('rbac:write'), 'Super admin should have rbac:write permission');
      assert.ok(validSession.permissions.has('reports:export'), 'Super admin should have reports:export permission');
    } catch (err) {
      console.error('Test 2 Exception:', err);
      throw err;
    }
  });

  await t.test('3. RoleModel creates custom dynamic roles and maps permissions', async () => {
    try {
      const customRoleKey = `editor_custom_${Date.now()}`;
      const newRole = await RoleModel.createRole({
        key: customRoleKey,
        name: 'Custom Editor',
        description: 'Custom editor role for testing',
        permissionKeys: ['cms:read', 'cms:write'],
      });

      assert.equal(newRole.key, customRoleKey);
      assert.equal(newRole.permissions.length, 2);
    } catch (err) {
      console.error('Test 3 Exception:', err);
      throw err;
    }
  });
});
