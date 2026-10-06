import { RoleRepository } from '../repositories/role.repo.js';
import { PermissionRepository } from '../repositories/permission.repo.js';
import { withTransaction } from '../db.transaction.js';

const roleRepo = new RoleRepository();
const permissionRepo = new PermissionRepository();

export class RoleModel {
  static async createRole({ key, name, description, permissionKeys = [] }) {
    const existing = await roleRepo.findByKey(key);
    if (existing) {
      throw new Error(`Role with key '${key}' already exists.`);
    }

    return await withTransaction(async (trx) => {
      const role = await roleRepo.create(
        {
          key,
          name,
          description,
          is_system: false,
          is_active: true,
        },
        trx
      );

      if (permissionKeys && permissionKeys.length > 0) {
        const perms = await trx('permissions').whereIn('key', permissionKeys).select('id');
        const permIds = perms.map((p) => p.id);
        if (permIds.length > 0) {
          await roleRepo.syncPermissions(role.id, permIds, trx);
        }
      }

      return await roleRepo.getRoleWithPermissions(role.id, trx);
    });
  }

  static async updateRole(roleId, { name, description, permissionKeys }) {
    const role = await roleRepo.findById(roleId);
    if (!role) {
      throw new Error('Role not found.');
    }

    return await withTransaction(async (trx) => {
      await roleRepo.update(roleId, { name, description }, trx);

      if (Array.isArray(permissionKeys)) {
        const perms = await trx('permissions').whereIn('key', permissionKeys).select('id');
        const permIds = perms.map((p) => p.id);
        await roleRepo.syncPermissions(roleId, permIds, trx);
      }

      return await roleRepo.getRoleWithPermissions(roleId, trx);
    });
  }

  static async deleteRole(roleId) {
    const role = await roleRepo.findById(roleId);
    if (!role) {
      throw new Error('Role not found.');
    }

    if (role.is_system) {
      throw new Error('Protected system roles cannot be deleted.');
    }

    return await roleRepo.delete(roleId);
  }
}

export default RoleModel;
