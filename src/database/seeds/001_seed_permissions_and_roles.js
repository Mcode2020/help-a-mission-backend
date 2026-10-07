/**
 * Seed permissions and system roles
 * @param { import("knex").Knex } knex
 */
export async function seed(knex) {
  // 1. Initial Permissions List
  const permissionsList = [
    { key: 'cms:read', module: 'CMS', description: 'View CMS pages and section drafts' },
    { key: 'cms:write', module: 'CMS', description: 'Create or edit CMS section content' },
    { key: 'cms:publish', module: 'CMS', description: 'Publish CMS drafts to live homepage' },
    { key: 'media:read', module: 'Media', description: 'View and browse uploaded media assets' },
    { key: 'media:write', module: 'Media', description: 'Upload new media assets' },
    { key: 'media:delete', module: 'Media', description: 'Delete media assets' },
    { key: 'initiatives:write', module: 'CMS', description: 'Create or edit initiative pages' },
    { key: 'gallery:write', module: 'CMS', description: 'Upload and organize gallery items' },
    { key: 'donors:read', module: 'Donors', description: 'View donor profiles and donation history' },
    { key: 'donations:read', module: 'Financials', description: 'View donation transaction records' },
    { key: 'reports:read', module: 'Analytics', description: 'Access financial summary dashboard' },
    { key: 'reports:export', module: 'Analytics', description: 'Export CSV/PDF financial reports' },
    { key: 'files:private_read', module: 'Files', description: 'Stream private internal documents' },
    { key: 'security:read', module: 'Security', description: 'View security logs and active sessions' },
    { key: 'security:write', module: 'Security', description: 'Revoke active admin sessions' },
    { key: 'rbac:read', module: 'RBAC', description: 'View dynamic roles and assignments' },
    { key: 'rbac:write', module: 'RBAC', description: 'Create roles and update permissions' },
    { key: 'rbac:assign', module: 'RBAC', description: 'Assign roles to admin accounts' },
  ];

  // Upsert permissions
  for (const perm of permissionsList) {
    await knex('permissions')
      .insert(perm)
      .onConflict('key')
      .merge(['module', 'description']);
  }

  // 2. Default System Roles
  const rolesList = [
    { key: 'super_admin', name: 'Super Administrator', description: 'Full system access across all modules', is_system: true },
    { key: 'admin', name: 'Administrator', description: 'General administrative and management access', is_system: true },
    { key: 'editor', name: 'Content Editor', description: 'CMS and media management access', is_system: true },
  ];

  for (const role of rolesList) {
    await knex('roles')
      .insert(role)
      .onConflict('key')
      .merge(['name', 'description', 'is_system']);
  }

  // 3. Assign All Permissions to Super Admin role
  const superAdminRole = await knex('roles').where('key', 'super_admin').first();
  const allPermissions = await knex('permissions').select('id');

  if (superAdminRole && allPermissions.length > 0) {
    const rolePerms = allPermissions.map((p) => ({
      role_id: superAdminRole.id,
      permission_id: p.id,
    }));

    await knex('role_permissions')
      .insert(rolePerms)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }
}
