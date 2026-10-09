/**
 * Migration: Create Members Table
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  const hasMembers = await knex.schema.hasTable('members');
  if (!hasMembers) {
    await knex.schema.createTable('members', (table) => {
      table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
      table.string('name', 255).notNullable();
      table.string('email', 255).nullable();
      table.string('phone', 32).nullable();
      table.string('title', 255).notNullable();
      table.text('description').nullable();
      table.text('image_url').nullable();
      table.string('status', 32).notNullable().defaultTo('published');
      table.string('language', 10).notNullable().defaultTo('en');
      table.integer('sort_order').notNullable().defaultTo(0);
      table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
      table.timestamp('deleted_at', { useTz: true }).nullable();
    });
  }
}

/**
 * Rollback Migration
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('members');
}
