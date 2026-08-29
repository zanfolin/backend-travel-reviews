/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('reviews', (table) => {
    table.increments('id').primary();
    table
      .integer('place_id')
      .notNullable()
      .references('id')
      .inTable('places')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table
      .integer('traveler_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.integer('experience_rating').notNullable();
    table.text('accessibility_level').notNullable();
    table.text('comment_text').nullable();
    table.text('owner_reply_text').nullable();

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['place_id'], 'idx_reviews_place_id');
    table.index(['traveler_id'], 'idx_reviews_traveler_id');
    table.index(['experience_rating'], 'idx_reviews_experience_rating');
    table.index(['accessibility_level'], 'idx_reviews_accessibility_level');
    table.index(['comment_text'], 'idx_reviews_comment_text');

    // Check constraints
    table.check(
      '?? >= 1 AND ?? <= 5',
      ['experience_rating', 'experience_rating'],
      'check_reviews_experience_rating'
    );
    table.check(
      "?? IN ('POOR', 'GOOD', 'EXCELLENT')",
      ['accessibility_level'],
      'check_reviews_accessibility_level'
    );
  });

  // Trigger to update updated_at automatically
  await knex.raw(`
    CREATE TRIGGER update_reviews_updated_at AFTER UPDATE ON reviews
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE reviews SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS update_reviews_updated_at');
  await knex.schema.dropTableIfExists('reviews');
}
