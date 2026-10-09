/**
 * Migration: Create Admin, RBAC, Session, and Audit tables
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  // Ensure pgcrypto extension for gen_random_uuid()
  await knex.raw('CREATE EXTENSION IF NOT EXISTS "pgcrypto"');

  // 1. Admins Table
  await knex.schema.createTable('admins', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable();
    table.string('email_normalized', 255).unique().notNullable();
    table.string('password_hash', 255).notNullable();
    table.string('password_algorithm', 32).notNullable().defaultTo('argon2id');
    table.boolean('mfa_enabled').notNullable().defaultTo(false);
    table.text('mfa_secret_encrypted').nullable();
    table.string('status', 32).notNullable().defaultTo('active');
    table.integer('authz_version').notNullable().defaultTo(1);
    table.timestamp('last_login_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();
  });

  // 2. Admin Sessions Table
  await knex.schema.createTable('admin_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('admin_id').notNullable().references('id').inTable('admins').onDelete('CASCADE');
    table.string('session_token_hash', 64).unique().notNullable();
    table.string('device_id', 128).notNullable();
    table.text('user_agent').nullable();
    table.string('ip_address', 45).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_seen_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('revoked_at', { useTz: true }).nullable();
    table.string('revocation_reason', 128).nullable();

    table.index(['admin_id'], 'idx_admin_sessions_admin_id');
    table.index(['session_token_hash'], 'idx_admin_sessions_token_hash');
  });

  // 3. Roles Table
  await knex.schema.createTable('roles', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('key', 64).unique().notNullable();
    table.string('name', 128).notNullable();
    table.text('description').nullable();
    table.boolean('is_system').notNullable().defaultTo(false);
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();
  });

  // 4. Permissions Table
  await knex.schema.createTable('permissions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('key', 64).unique().notNullable();
    table.string('module', 64).notNullable();
    table.text('description').nullable();
    table.boolean('is_active').notNullable().defaultTo(true);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 5. Role Permissions Join Table
  await knex.schema.createTable('role_permissions', (table) => {
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.primary(['role_id', 'permission_id']);
  });

  // 6. Admin Roles Join Table
  await knex.schema.createTable('admin_roles', (table) => {
    table.uuid('admin_id').notNullable().references('id').inTable('admins').onDelete('CASCADE');
    table.uuid('role_id').notNullable().references('id').inTable('roles').onDelete('RESTRICT');
    table.primary(['admin_id', 'role_id']);
  });

  // 7. Admin Permission Overrides Table
  await knex.schema.createTable('admin_permission_overrides', (table) => {
    table.uuid('admin_id').notNullable().references('id').inTable('admins').onDelete('CASCADE');
    table.uuid('permission_id').notNullable().references('id').inTable('permissions').onDelete('CASCADE');
    table.string('effect', 8).notNullable();
    table.primary(['admin_id', 'permission_id']);
  });

  // 8. Audit Events Table
  await knex.schema.createTable('audit_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('request_id', 64).notNullable();
    table.string('actor_type', 32).notNullable();
    table.uuid('actor_id').nullable();
    table.string('action', 128).notNullable();
    table.string('entity_type', 64).notNullable();
    table.string('entity_id', 128).nullable();
    table.jsonb('before_redacted').nullable();
    table.jsonb('after_redacted').nullable();
    table.string('device_id', 128).nullable();
    table.string('ip_address', 45).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['actor_id', 'created_at'], 'idx_audit_events_actor');
    table.index(['request_id'], 'idx_audit_events_request');
  });
}

/**
 * Rollback Migration
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('audit_events');
  await knex.schema.dropTableIfExists('admin_permission_overrides');
  await knex.schema.dropTableIfExists('admin_roles');
  await knex.schema.dropTableIfExists('role_permissions');
  await knex.schema.dropTableIfExists('permissions');
  await knex.schema.dropTableIfExists('roles');
  await knex.schema.dropTableIfExists('admin_sessions');
  await knex.schema.dropTableIfExists('admins');
}
