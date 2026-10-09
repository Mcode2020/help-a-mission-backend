import db from '../database/knex.client.js';

async function resetSchema() {
  console.log('Resetting legacy database tables...');

  await db.raw('DROP TABLE IF EXISTS audit_events CASCADE;');
  await db.raw('DROP TABLE IF EXISTS admin_permission_overrides CASCADE;');
  await db.raw('DROP TABLE IF EXISTS admin_roles CASCADE;');
  await db.raw('DROP TABLE IF EXISTS role_permissions CASCADE;');
  await db.raw('DROP TABLE IF EXISTS permissions CASCADE;');
  await db.raw('DROP TABLE IF EXISTS roles CASCADE;');
  await db.raw('DROP TABLE IF EXISTS admin_sessions CASCADE;');
  await db.raw('DROP TABLE IF EXISTS admins CASCADE;');
  await db.raw('DROP TABLE IF EXISTS knex_migrations CASCADE;');
  await db.raw('DROP TABLE IF EXISTS knex_migrations_lock CASCADE;');

  console.log('Legacy tables dropped successfully.');
  process.exit(0);
}

resetSchema().catch((err) => {
  console.error(err);
  process.exit(1);
});
