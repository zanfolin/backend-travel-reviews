import bcrypt from 'bcryptjs';

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
export async function seed(knex) {
  // Clear existing entries in reverse foreign key order
  await knex('reviews').del();
  await knex('places').del();
  await knex('users').del();

  const hashedAdminPassword = await bcrypt.hash('admin123', 10);
  const hashedTravelerPassword = await bcrypt.hash('traveler123', 10);

  // Insert initial users
  const [adminUser] = await knex('users')
    .insert([
      {
        id: 1,
        full_name: 'Administrador Business',
        email: 'admin@admin.com',
        password: hashedAdminPassword,
        email_verified: 1,
        email_code: null,
        user_type: 'BUSINESS',
        profile_picture: null
      },
      {
        id: 2,
        full_name: 'Viajante Demo',
        email: 'traveler@traveler.com',
        password: hashedTravelerPassword,
        email_verified: 1,
        email_code: null,
        user_type: 'TRAVELER',
        profile_picture: null
      }
    ])
    .returning('*');

  // Insert initial places from DBML
  await knex('places').insert([
    {
      id: 1,
      business_owner_id: 1,
      establishment_name: 'Hotel Unique',
      category: 'ACCOMMODATION',
      full_address: 'Avenida Brigadeiro Luís Antônio 4700 - Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Hotel de luxo em São Paulo com estrutura completa e localização próxima ao Parque Ibirapuera e à Avenida Paulista.',
      price: 120000,
      main_image: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 1
    },
    {
      id: 2,
      business_owner_id: 1,
      establishment_name: 'Restaurante A Figueira Rubaiyat',
      category: 'GASTRONOMY',
      full_address: 'Rua Haddock Lobo 1738 - Jardim Paulista',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Restaurante conhecido por sua gastronomia e por seu amplo salão integrado a uma grande figueira centenária.',
      price: 15000,
      main_image: 'https://images.unsplash.com/photo-1517248135467-4c7edcad34c4?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 0,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 1
    },
    {
      id: 3,
      business_owner_id: 1,
      establishment_name: 'MASP - Museu de Arte de São Paulo',
      category: 'TOURIST_ATTRACTION',
      full_address: 'Avenida Paulista 1578 - Bela Vista',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Um dos principais museus de arte do Brasil, localizado na Avenida Paulista e conhecido por seu acervo e exposições.',
      price: 7000,
      main_image: 'https://images.unsplash.com/photo-1582555172866-f73bb12a2ab3?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 1,
      has_asd_friendly_space: 1
    },
    {
      id: 4,
      business_owner_id: 1,
      establishment_name: 'Parque Ibirapuera',
      category: 'TOURIST_ATTRACTION',
      full_address: 'Avenida Pedro Álvares Cabral - Vila Mariana',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Um dos parques mais conhecidos de São Paulo, com áreas verdes, espaços culturais, trilhas e opções de lazer.',
      price: 0,
      main_image: 'https://images.unsplash.com/photo-1596422846543-75c6fc197f07?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 0,
      has_sign_language_interpreter: 0,
      has_asd_friendly_space: 1
    },
    {
      id: 5,
      business_owner_id: 1,
      establishment_name: 'Pinacoteca de São Paulo',
      category: 'TOURIST_ATTRACTION',
      full_address: 'Praça da Luz 2 - Luz',
      city: 'São Paulo',
      state: 'SP',
      description:
        'Museu de arte localizado no centro de São Paulo com importante acervo de arte brasileira e exposições temporárias.',
      price: 3000,
      main_image: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=1080',
      has_access_ramp: 1,
      has_adapted_bathroom: 1,
      allows_guide_dog: 1,
      has_braille_signage: 1,
      has_sign_language_interpreter: 1,
      has_asd_friendly_space: 1
    }
  ]);

  // Insert sample reviews
  await knex('reviews').insert([
    {
      id: 1,
      place_id: 3,
      traveler_id: 2,
      experience_rating: 5,
      accessibility_level: 'EXCELLENT',
      comment_text:
        'Excelente acessibilidade para cadeirantes! Elevadores espaçosos, rampas de acesso excelentes e monitores com Libras.',
      owner_reply_text: 'Agradecemos sua visita e sua avaliação sobre nossa infraestrutura acessível!'
    },
    {
      id: 2,
      place_id: 1,
      traveler_id: 2,
      experience_rating: 4,
      accessibility_level: 'GOOD',
      comment_text:
        'Banheiros adaptados muito limpos e quartos com portas largas. Equipe atenciosa.',
      owner_reply_text: 'Ficamos muito felizes em proporcionar uma experiência agradável e acessível!'
    }
  ]);
}
