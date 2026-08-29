/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('users', (table) => {
    table.increments('id').primary();
    table.text('full_name').nullable();
    table.text('email').notNullable().unique();
    table.text('password').notNullable();
    table.integer('email_verified').notNullable().defaultTo(0);
    table.text('email_code').nullable();
    table.text('user_type').notNullable();
    table.text('profile_picture').nullable();
    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['email'], 'idx_users_email');
    table.index(['full_name'], 'idx_users_full_name');
    table.index(['user_type'], 'idx_users_user_type');

    // Check constraints
    table.check('?? IN (0, 1)', ['email_verified'], 'check_users_email_verified');
    table.check("?? IN ('TRAVELER', 'BUSINESS')", ['user_type'], 'check_users_user_type');
  });

  // Trigger to update updated_at automatically
  await knex.raw(`
    CREATE TRIGGER update_users_updated_at AFTER UPDATE ON users
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE users SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS update_users_updated_at');
  await knex.schema.dropTableIfExists('users');
}
