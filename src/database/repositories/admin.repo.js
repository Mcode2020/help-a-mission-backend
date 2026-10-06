import BaseRepository from './base.repo.js';
import db from '../knex.client.js';

export class AdminRepository extends BaseRepository {
  constructor() {
    super('admins', true);
  }

  async findByEmailNormalized(emailNormalized) {
    return await this.findOneWhere({ email_normalized: emailNormalized });
  }

  async incrementAuthzVersion(adminId, trx = null) {
    const qb = trx ? trx('admins') : db('admins');
    const [updated] = await qb
      .where({ id: adminId })
      .increment('authz_version', 1)
      .returning('*');
    return updated;
  }

  async getAdminWithRoles(adminId) {
    const admin = await this.findById(adminId);
    if (!admin) return null;

    const roles = await db('admin_roles')
      .join('roles', 'admin_roles.role_id', 'roles.id')
      .where('admin_roles.admin_id', adminId)
      .where('roles.is_active', true)
      .whereNull('roles.deleted_at')
      .select('roles.id', 'roles.key', 'roles.name', 'roles.is_system');

    return {
      ...admin,
      roles,
    };
  }

  async assignRoles(adminId, roleIds, trx = null) {
    const targetDb = trx || db;
    // Clear existing role assignments
    await targetDb('admin_roles').where({ admin_id: adminId }).del();

    if (roleIds && roleIds.length > 0) {
      const records = roleIds.map((roleId) => ({
        admin_id: adminId,
        role_id: roleId,
      }));
      await targetDb('admin_roles').insert(records);
    }

    await this.incrementAuthzVersion(adminId, targetDb);
  }

  async getResolvedPermissions(adminId) {
    const query = `
      WITH role_perms AS (
        SELECT p.key 
        FROM admin_roles ar
        JOIN role_permissions rp ON ar.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        JOIN roles r ON ar.role_id = r.id
        WHERE ar.admin_id = ? AND r.is_active = true AND r.deleted_at IS NULL AND p.is_active = true
      ),
      overrides AS (
        SELECT p.key, apo.effect 
        FROM admin_permission_overrides apo
        JOIN permissions p ON apo.permission_id = p.id
        WHERE apo.admin_id = ? AND p.is_active = true
      )
      SELECT key FROM role_perms WHERE key NOT IN (SELECT key FROM overrides WHERE effect = 'deny')
      UNION
      SELECT key FROM overrides WHERE effect = 'allow';
    `;

    const { rows } = await db.raw(query, [adminId, adminId]);
    return rows.map((r) => r.key);
  }
}

export default AdminRepository;
