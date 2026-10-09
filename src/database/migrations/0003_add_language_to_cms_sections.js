/**
 * Migration: Add language column and composite unique constraint to cms_sections
 */
export async function up(knex) {
  const hasLanguage = await knex.schema.hasColumn('cms_sections', 'language');
  if (!hasLanguage) {
    await knex.schema.alterTable('cms_sections', (table) => {
      table.string('language', 10).notNullable().defaultTo('en');
      table.dropUnique(['page_id', 'section_key']);
      table.unique(['page_id', 'section_key', 'language']);
    });
  }
}

export async function down(knex) {
  const hasLanguage = await knex.schema.hasColumn('cms_sections', 'language');
  if (hasLanguage) {
    await knex.schema.alterTable('cms_sections', (table) => {
      table.dropUnique(['page_id', 'section_key', 'language']);
      table.unique(['page_id', 'section_key']);
      table.dropColumn('language');
    });
  }
}
