/**
 * Migration: Create Users, Donations, CMS, Media, Reminders and Jobs tables
 * @param { import("knex").Knex } knex
 */
export async function up(knex) {
  // 1. Users / Donors Table
  await knex.schema.createTable('users', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('email', 255).notNullable();
    table.string('email_normalized', 255).unique().notNullable();
    table.string('phone', 32).nullable();
    table.string('phone_normalized', 32).nullable();
    table.string('name', 255).notNullable();
    table.string('status', 32).notNullable().defaultTo('active');
    table.timestamp('email_verified_at', { useTz: true }).nullable();
    table.timestamp('phone_verified_at', { useTz: true }).nullable();
    table.string('created_source', 32).notNullable().defaultTo('signup');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('deleted_at', { useTz: true }).nullable();
  });

  // 2. User Sessions Table
  await knex.schema.createTable('user_sessions', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.string('session_token_hash', 64).unique().notNullable();
    table.string('device_id', 128).notNullable();
    table.text('user_agent').nullable();
    table.string('ip_address', 45).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('last_seen_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('expires_at', { useTz: true }).notNullable();
    table.timestamp('revoked_at', { useTz: true }).nullable();
  });

  // 3. Donations Table
  await knex.schema.createTable('donations', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('RESTRICT');
    table.bigInteger('amount_minor').notNullable();
    table.string('currency', 3).notNullable().defaultTo('INR');
    table.string('status', 32).notNullable().defaultTo('initiated');
    table.text('message').nullable();
    table.string('razorpay_order_id', 128).nullable();
    table.string('razorpay_payment_id', 128).nullable();
    table.string('payment_method_summary', 64).nullable();
    table.timestamp('paid_at', { useTz: true }).nullable();
    table.bigInteger('refunded_amount_minor').notNullable().defaultTo(0);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['user_id', 'created_at'], 'idx_donations_user_created');
    table.index(['status', 'paid_at'], 'idx_donations_status_paid');
  });

  // 4. Payment Attempts Table
  await knex.schema.createTable('payment_attempts', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('donation_id').notNullable().references('id').inTable('donations').onDelete('CASCADE');
    table.string('provider', 32).notNullable().defaultTo('razorpay');
    table.string('provider_order_id', 128).notNullable();
    table.string('provider_payment_id', 128).nullable();
    table.string('status', 32).notNullable();
    table.string('failure_code', 64).nullable();
    table.text('failure_description_sanitized').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 5. Payment Webhook Events Table
  await knex.schema.createTable('payment_webhook_events', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('provider_event_id', 128).unique().notNullable();
    table.string('event_type', 64).notNullable();
    table.boolean('signature_verified').notNullable();
    table.string('payload_hash', 64).notNullable();
    table.string('processing_status', 32).notNullable().defaultTo('pending');
    table.text('error_sanitized').nullable();
    table.timestamp('received_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('processed_at', { useTz: true }).nullable();
  });

  // 6. Media Assets Table
  await knex.schema.createTable('media_assets', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('visibility', 16).notNullable();
    table.string('storage_type', 32).notNullable();
    table.text('relative_path').notNullable();
    table.text('public_url').nullable();
    table.string('mime_type', 128).notNullable();
    table.bigInteger('size_bytes').notNullable();
    table.string('sha256', 64).notNullable();
    table.integer('width').nullable();
    table.integer('height').nullable();
    table.uuid('uploaded_by').nullable().references('id').inTable('admins').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 7. CMS Pages Table
  await knex.schema.createTable('cms_pages', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 128).unique().notNullable();
    table.string('title', 255).notNullable();
    table.string('status', 32).notNullable().defaultTo('draft');
    table.jsonb('seo_json').nullable();
    table.uuid('created_by').nullable().references('id').inTable('admins').onDelete('SET NULL');
    table.uuid('updated_by').nullable().references('id').inTable('admins').onDelete('SET NULL');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 8. CMS Sections Table
  await knex.schema.createTable('cms_sections', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('page_id').notNullable().references('id').inTable('cms_pages').onDelete('CASCADE');
    table.string('section_key', 64).notNullable();
    table.string('section_type', 64).notNullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.jsonb('content_json').notNullable();
    table.string('status', 32).notNullable().defaultTo('published');
    table.integer('version').notNullable().defaultTo(1);
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.unique(['page_id', 'section_key']);
  });

  // 9. Gallery Items Table
  await knex.schema.createTable('gallery_items', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('media_asset_id').notNullable().references('id').inTable('media_assets').onDelete('RESTRICT');
    table.string('title', 255).nullable();
    table.text('caption').nullable();
    table.string('alt_text', 255).nullable();
    table.string('category', 64).nullable();
    table.integer('sort_order').notNullable().defaultTo(0);
    table.string('status', 32).notNullable().defaultTo('published');
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 10. Initiatives Table
  await knex.schema.createTable('initiatives', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('slug', 128).unique().notNullable();
    table.string('title', 255).notNullable();
    table.text('summary').notNullable();
    table.text('body').notNullable();
    table.uuid('cover_media_asset_id').nullable().references('id').inTable('media_assets').onDelete('SET NULL');
    table.string('status', 32).notNullable().defaultTo('draft');
    table.timestamp('published_at', { useTz: true }).nullable();
    table.jsonb('seo_json').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 11. Donation Reminder Preferences Table
  await knex.schema.createTable('donation_reminder_preferences', (table) => {
    table.uuid('user_id').primary().references('id').inTable('users').onDelete('CASCADE');
    table.boolean('enabled').notNullable().defaultTo(true);
    table.integer('days_after_last_donation').notNullable().defaultTo(30);
    table.timestamp('last_reminder_sent_at', { useTz: true }).nullable();
    table.timestamp('next_reminder_at', { useTz: true }).nullable();
    table.timestamp('updated_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 12. Reminder Deliveries Table
  await knex.schema.createTable('reminder_deliveries', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.uuid('user_id').notNullable().references('id').inTable('users').onDelete('CASCADE');
    table.uuid('donation_id_reference').nullable().references('id').inTable('donations').onDelete('SET NULL');
    table.string('channel', 32).notNullable().defaultTo('email');
    table.string('status', 32).notNullable().defaultTo('pending');
    table.string('provider_message_id', 128).nullable();
    table.timestamp('scheduled_for', { useTz: true }).notNullable();
    table.timestamp('sent_at', { useTz: true }).nullable();
    table.text('error_sanitized').nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());
  });

  // 13. Durable Jobs Queue Table
  await knex.schema.createTable('jobs', (table) => {
    table.uuid('id').primary().defaultTo(knex.raw('gen_random_uuid()'));
    table.string('job_type', 64).notNullable();
    table.jsonb('payload').notNullable().defaultTo('{}');
    table.string('status', 32).notNullable().defaultTo('pending');
    table.timestamp('scheduled_for', { useTz: true }).notNullable().defaultTo(knex.fn.now());
    table.timestamp('locked_at', { useTz: true }).nullable();
    table.string('locked_by', 128).nullable();
    table.integer('attempt_count').notNullable().defaultTo(0);
    table.integer('max_attempts').notNullable().defaultTo(3);
    table.text('last_error').nullable();
    table.timestamp('completed_at', { useTz: true }).nullable();
    table.timestamp('created_at', { useTz: true }).notNullable().defaultTo(knex.fn.now());

    table.index(['status', 'scheduled_for'], 'idx_jobs_status_scheduled');
  });
}

/**
 * Rollback Migration
 * @param { import("knex").Knex } knex
 */
export async function down(knex) {
  await knex.schema.dropTableIfExists('jobs');
  await knex.schema.dropTableIfExists('reminder_deliveries');
  await knex.schema.dropTableIfExists('donation_reminder_preferences');
  await knex.schema.dropTableIfExists('initiatives');
  await knex.schema.dropTableIfExists('gallery_items');
  await knex.schema.dropTableIfExists('cms_sections');
  await knex.schema.dropTableIfExists('cms_pages');
  await knex.schema.dropTableIfExists('media_assets');
  await knex.schema.dropTableIfExists('payment_webhook_events');
  await knex.schema.dropTableIfExists('payment_attempts');
  await knex.schema.dropTableIfExists('donations');
  await knex.schema.dropTableIfExists('user_sessions');
  await knex.schema.dropTableIfExists('users');
}
