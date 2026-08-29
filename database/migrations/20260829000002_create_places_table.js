/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function up(knex) {
  await knex.schema.createTable('places', (table) => {
    table.increments('id').primary();
    table
      .integer('business_owner_id')
      .notNullable()
      .references('id')
      .inTable('users')
      .onDelete('CASCADE')
      .onUpdate('CASCADE');
    table.text('establishment_name').notNullable();
    table.text('category').notNullable();
    table.text('full_address').notNullable();
    table.text('city').notNullable();
    table.text('state').notNullable();
    table.text('description').nullable();
    table.decimal('price', 14, 2).nullable(); // price in cents as integer/numeric
    table.text('main_image').nullable();

    // Accessibility flags
    table.integer('has_access_ramp').notNullable().defaultTo(0);
    table.integer('has_adapted_bathroom').notNullable().defaultTo(0);
    table.integer('allows_guide_dog').notNullable().defaultTo(0);
    table.integer('has_braille_signage').notNullable().defaultTo(0);
    table.integer('has_sign_language_interpreter').notNullable().defaultTo(0);
    table.integer('has_asd_friendly_space').notNullable().defaultTo(0);

    table.timestamp('created_at').notNullable().defaultTo(knex.fn.now());
    table.timestamp('updated_at').notNullable().defaultTo(knex.fn.now());

    // Indexes
    table.index(['establishment_name'], 'idx_places_establishment_name');
    table.index(['city'], 'idx_places_city');
    table.index(['state'], 'idx_places_state');
    table.index(['category'], 'idx_places_category');
    table.index(['description'], 'idx_places_description');
    table.index(['price'], 'idx_places_price');

    // Check constraints
    table.check(
      "?? IN ('ACCOMMODATION', 'GASTRONOMY', 'TOURIST_ATTRACTION', 'OTHERS')",
      ['category'],
      'check_places_category'
    );
    table.check('?? IN (0, 1)', ['has_access_ramp'], 'check_places_has_access_ramp');
    table.check('?? IN (0, 1)', ['has_adapted_bathroom'], 'check_places_has_adapted_bathroom');
    table.check('?? IN (0, 1)', ['allows_guide_dog'], 'check_places_allows_guide_dog');
    table.check('?? IN (0, 1)', ['has_braille_signage'], 'check_places_has_braille_signage');
    table.check(
      '?? IN (0, 1)',
      ['has_sign_language_interpreter'],
      'check_places_has_sign_language_interpreter'
    );
    table.check('?? IN (0, 1)', ['has_asd_friendly_space'], 'check_places_has_asd_friendly_space');
  });

  // Trigger to update updated_at automatically
  await knex.raw(`
    CREATE TRIGGER update_places_updated_at AFTER UPDATE ON places
    FOR EACH ROW
    WHEN NEW.updated_at = OLD.updated_at
    BEGIN
      UPDATE places SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
  `);
}

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function down(knex) {
  await knex.raw('DROP TRIGGER IF EXISTS update_places_updated_at');
  await knex.schema.dropTableIfExists('places');
}
