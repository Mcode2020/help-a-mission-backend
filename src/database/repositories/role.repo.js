import BaseRepository from './base.repo.js';
import db from '../knex.client.js';

export class RoleRepository extends BaseRepository {
  constructor() {
    super('roles', true);
  }

  async findByKey(key, trx = null) {
    return await this.findOneWhere({ key }, trx);
  }

  async getRoleWithPermissions(roleId, trx = null) {
    const role = await this.findById(roleId, trx);
    if (!role) return null;

    const targetDb = trx || db;
    const permissions = await targetDb('role_permissions')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', roleId)
      .where('permissions.is_active', true)
      .select('permissions.id', 'permissions.key', 'permissions.module', 'permissions.description');

    return {
      ...role,
      permissions,
    };
  }

  async syncPermissions(roleId, permissionIds, trx = null) {
    const targetDb = trx || db;
    // Clear existing permissions
    await targetDb('role_permissions').where({ role_id: roleId }).del();

    if (permissionIds && permissionIds.length > 0) {
      const records = permissionIds.map((permissionId) => ({
        role_id: roleId,
        permission_id: permissionId,
      }));
      await targetDb('role_permissions').insert(records);
    }
  }
}

export default RoleRepository;
