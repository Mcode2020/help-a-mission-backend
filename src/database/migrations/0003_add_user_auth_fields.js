/**
 * Migration: Add authentication fields to users table
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  const hasPasswordHash = await knex.schema.hasColumn('users', 'password_hash');
  if (!hasPasswordHash) {
    await knex.schema.alterTable('users', (table) => {
      table.string('password_hash', 255).nullable();
      table.string('password_algorithm', 32).notNullable().defaultTo('argon2id');
      table.string('role', 32).notNullable().defaultTo('donor');
      table.timestamp('last_login_at', { useTz: true }).nullable();
    });
  }
}

/**
 * Rollback Migration
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.alterTable('users', (table) => {
    table.dropColumn('last_login_at');
    table.dropColumn('role');
    table.dropColumn('password_algorithm');
    table.dropColumn('password_hash');
  });
}
