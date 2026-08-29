import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';

const VALID_CATEGORIES = ['ACCOMMODATION', 'GASTRONOMY', 'TOURIST_ATTRACTION', 'OTHERS'];

/**
 * Listagem pública / para viajantes com filtros avançados e métricas agregadas
 */
export async function listPlaces(req, res, next) {
  try {
    const {
      search,
      category,
      city,
      state,
      min_price,
      max_price,
      has_access_ramp,
      has_adapted_bathroom,
      allows_guide_dog,
      has_braille_signage,
      has_sign_language_interpreter,
      has_asd_friendly_space,
      sort_by = 'newest',
      page = 1,
      limit = 20
    } = req.query;

    let query = db('places')
      .leftJoin('reviews', 'places.id', 'reviews.place_id')
      .leftJoin('users', 'places.business_owner_id', 'users.id')
      .select(
        'places.*',
        'users.full_name as owner_name',
        db.raw('ROUND(AVG(reviews.experience_rating), 1) as average_rating'),
        db.raw('COUNT(reviews.id) as total_reviews')
      )
      .groupBy('places.id');

    // Filtro por termo de busca geral
    if (search) {
      const searchTerm = `%${search.trim()}%`;
      query = query.where((builder) => {
        builder
          .where('places.establishment_name', 'like', searchTerm)
          .orWhere('places.description', 'like', searchTerm)
          .orWhere('places.city', 'like', searchTerm)
          .orWhere('places.full_address', 'like', searchTerm);
      });
    }

    // Filtro por categoria
    if (category) {
      const catUpper = category.toUpperCase();
      if (VALID_CATEGORIES.includes(catUpper)) {
        query = query.where('places.category', catUpper);
      }
    }

    // Filtros geográficos
    if (city) {
      query = query.where('places.city', 'like', `%${city.trim()}%`);
    }
    if (state) {
      query = query.where('places.state', 'like', `%${state.trim().toUpperCase()}%`);
    }

    // Filtros de preço
    if (min_price !== undefined) {
      query = query.where('places.price', '>=', Number(min_price));
    }
    if (max_price !== undefined) {
      query = query.where('places.price', '<=', Number(max_price));
    }

    // Filtros de acessibilidade
    const accessibilityFields = [
      { param: has_access_ramp, field: 'has_access_ramp' },
      { param: has_adapted_bathroom, field: 'has_adapted_bathroom' },
      { param: allows_guide_dog, field: 'allows_guide_dog' },
      { param: has_braille_signage, field: 'has_braille_signage' },
      { param: has_sign_language_interpreter, field: 'has_sign_language_interpreter' },
      { param: has_asd_friendly_space, field: 'has_asd_friendly_space' }
    ];

    accessibilityFields.forEach(({ param, field }) => {
      if (param !== undefined && param !== null && param !== '') {
        const strParam = String(param).toLowerCase().trim();
        if (strParam === '1' || strParam === 'true') {
          query = query.where(`places.${field}`, 1);
        } else if (strParam === '0' || strParam === 'false') {
          query = query.where(`places.${field}`, 0);
        }
      }
    });

    // Ordenação
    switch (sort_by) {
      case 'rating_desc':
        query = query.orderBy(db.raw('AVG(reviews.experience_rating)'), 'desc');
        break;
      case 'rating_asc':
        query = query.orderBy(db.raw('AVG(reviews.experience_rating)'), 'asc');
        break;
      case 'price_asc':
        query = query.orderBy('places.price', 'asc');
        break;
      case 'price_desc':
        query = query.orderBy('places.price', 'desc');
        break;
      case 'name_asc':
        query = query.orderBy('places.establishment_name', 'asc');
        break;
      case 'newest':
      default:
        query = query.orderBy('places.created_at', 'desc');
        break;
    }

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, Math.min(100, parseInt(limit, 10) || 20));
    const offset = (pageNum - 1) * limitNum;

    const places = await query.limit(limitNum).offset(offset);

    // Format boolean fields and numeric ratings
    const formattedPlaces = places.map((place) => ({
      ...place,
      average_rating: place.average_rating ? parseFloat(place.average_rating) : null,
      total_reviews: parseInt(place.total_reviews, 10) || 0,
      has_access_ramp: Boolean(place.has_access_ramp),
      has_adapted_bathroom: Boolean(place.has_adapted_bathroom),
      allows_guide_dog: Boolean(place.allows_guide_dog),
      has_braille_signage: Boolean(place.has_braille_signage),
      has_sign_language_interpreter: Boolean(place.has_sign_language_interpreter),
      has_asd_friendly_space: Boolean(place.has_asd_friendly_space)
    }));

    return res.status(200).json({
      page: pageNum,
      limit: limitNum,
      total: formattedPlaces.length,
      places: formattedPlaces
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Detalhes de um local específico
 */
export async function getPlaceById(req, res, next) {
  try {
    const { id } = req.params;

    const place = await db('places')
      .leftJoin('users', 'places.business_owner_id', 'users.id')
      .select(
        'places.*',
        'users.full_name as owner_name',
        'users.email as owner_email'
      )
      .where('places.id', id)
      .first();

    if (!place) {
      throw new AppError('Local não encontrado.', 404);
    }

    // Avaliações do local
    const reviews = await db('reviews')
      .join('users', 'reviews.traveler_id', 'users.id')
      .select(
        'reviews.id',
        'reviews.experience_rating',
        'reviews.accessibility_level',
        'reviews.comment_text',
        'reviews.owner_reply_text',
        'reviews.created_at',
        'reviews.updated_at',
        'users.id as traveler_id',
        'users.full_name as traveler_name',
        'users.profile_picture as traveler_avatar'
      )
      .where('reviews.place_id', id)
      .orderBy('reviews.created_at', 'desc');

    // Estatísticas agregadas
    const stats = await db('reviews')
      .where('place_id', id)
      .select(
        db.raw('ROUND(AVG(experience_rating), 1) as average_rating'),
        db.raw('COUNT(*) as total_reviews'),
        db.raw("SUM(CASE WHEN accessibility_level = 'EXCELLENT' THEN 1 ELSE 0 END) as count_excellent"),
        db.raw("SUM(CASE WHEN accessibility_level = 'GOOD' THEN 1 ELSE 0 END) as count_good"),
        db.raw("SUM(CASE WHEN accessibility_level = 'POOR' THEN 1 ELSE 0 END) as count_poor")
      )
      .first();

    const formattedPlace = {
      ...place,
      has_access_ramp: Boolean(place.has_access_ramp),
      has_adapted_bathroom: Boolean(place.has_adapted_bathroom),
      allows_guide_dog: Boolean(place.allows_guide_dog),
      has_braille_signage: Boolean(place.has_braille_signage),
      has_sign_language_interpreter: Boolean(place.has_sign_language_interpreter),
      has_asd_friendly_space: Boolean(place.has_asd_friendly_space),
      stats: {
        average_rating: stats?.average_rating ? parseFloat(stats.average_rating) : null,
        total_reviews: parseInt(stats?.total_reviews || 0, 10),
        accessibility_breakdown: {
          excellent: parseInt(stats?.count_excellent || 0, 10),
          good: parseInt(stats?.count_good || 0, 10),
          poor: parseInt(stats?.count_poor || 0, 10)
        }
      },
      reviews
    };

    return res.status(200).json({ place: formattedPlace });
  } catch (error) {
    next(error);
  }
}

/**
 * Criação de local (Exclusivo para BUSINESS)
 */
export async function createPlace(req, res, next) {
  try {
    const {
      establishment_name,
      category,
      full_address,
      city,
      state,
      description,
      price,
      main_image: imageUrl,
      has_access_ramp,
      has_adapted_bathroom,
      allows_guide_dog,
      has_braille_signage,
      has_sign_language_interpreter,
      has_asd_friendly_space
    } = req.body;

    if (!establishment_name || !category || !full_address || !city || !state) {
      throw new AppError(
        'Campos obrigatórios: establishment_name, category, full_address, city, state.',
        400
      );
    }

    const catUpper = category.toUpperCase();
    if (!VALID_CATEGORIES.includes(catUpper)) {
      throw new AppError(
        `Categoria inválida. Opções permitidas: ${VALID_CATEGORIES.join(', ')}`,
        400
      );
    }

    // Se houve upload via multer, usa o caminho da imagem salva
    let main_image = imageUrl || null;
    if (req.file) {
      main_image = `${req.protocol}://${req.get('host')}/uploads/places/${req.file.filename}`;
    }

    const toBinary = (val) => (val === '1' || val === 'true' || val === true || val === 1 ? 1 : 0);

    const [newId] = await db('places').insert({
      business_owner_id: req.user.id,
      establishment_name: establishment_name.trim(),
      category: catUpper,
      full_address: full_address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      description: description?.trim() || null,
      price: price !== undefined && price !== null ? Number(price) : null,
      main_image,
      has_access_ramp: toBinary(has_access_ramp),
      has_adapted_bathroom: toBinary(has_adapted_bathroom),
      allows_guide_dog: toBinary(allows_guide_dog),
      has_braille_signage: toBinary(has_braille_signage),
      has_sign_language_interpreter: toBinary(has_sign_language_interpreter),
      has_asd_friendly_space: toBinary(has_asd_friendly_space)
    });

    const createdPlace = await db('places').where({ id: newId }).first();

    return res.status(201).json({
      message: 'Local cadastrado com sucesso!',
      place: createdPlace
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Atualização de local (Exclusivo para o proprietário BUSINESS do local)
 */
export async function updatePlace(req, res, next) {
  try {
    const { id } = req.params;
    const {
      establishment_name,
      category,
      full_address,
      city,
      state,
      description,
      price,
      main_image: imageUrl,
      has_access_ramp,
      has_adapted_bathroom,
      allows_guide_dog,
      has_braille_signage,
      has_sign_language_interpreter,
      has_asd_friendly_space
    } = req.body;

    const existingPlace = await db('places').where({ id }).first();
    if (!existingPlace) {
      throw new AppError('Local não encontrado.', 404);
    }

    if (existingPlace.business_owner_id !== req.user.id) {
      throw new AppError('Você não tem permissão para editar este local.', 403);
    }

    const updateData = {};
    if (establishment_name !== undefined) updateData.establishment_name = establishment_name.trim();
    if (category !== undefined) {
      const catUpper = category.toUpperCase();
      if (!VALID_CATEGORIES.includes(catUpper)) {
        throw new AppError(`Categoria inválida: ${VALID_CATEGORIES.join(', ')}`, 400);
      }
      updateData.category = catUpper;
    }
    if (full_address !== undefined) updateData.full_address = full_address.trim();
    if (city !== undefined) updateData.city = city.trim();
    if (state !== undefined) updateData.state = state.trim().toUpperCase();
    if (description !== undefined) updateData.description = description.trim();
    if (price !== undefined) updateData.price = Number(price);

    const toBinary = (val) => (val === '1' || val === 'true' || val === true || val === 1 ? 1 : 0);

    if (has_access_ramp !== undefined) updateData.has_access_ramp = toBinary(has_access_ramp);
    if (has_adapted_bathroom !== undefined) updateData.has_adapted_bathroom = toBinary(has_adapted_bathroom);
    if (allows_guide_dog !== undefined) updateData.allows_guide_dog = toBinary(allows_guide_dog);
    if (has_braille_signage !== undefined) updateData.has_braille_signage = toBinary(has_braille_signage);
    if (has_sign_language_interpreter !== undefined)
      updateData.has_sign_language_interpreter = toBinary(has_sign_language_interpreter);
    if (has_asd_friendly_space !== undefined)
      updateData.has_asd_friendly_space = toBinary(has_asd_friendly_space);

    if (req.file) {
      updateData.main_image = `${req.protocol}://${req.get('host')}/uploads/places/${req.file.filename}`;
    } else if (imageUrl !== undefined) {
      updateData.main_image = imageUrl.trim() || null;
    }

    await db('places').where({ id }).update(updateData);

    const updatedPlace = await db('places').where({ id }).first();

    return res.status(200).json({
      message: 'Local atualizado com sucesso!',
      place: updatedPlace
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Exclusão de local (Exclusivo para o proprietário BUSINESS do local)
 */
export async function deletePlace(req, res, next) {
  try {
    const { id } = req.params;

    const existingPlace = await db('places').where({ id }).first();
    if (!existingPlace) {
      throw new AppError('Local não encontrado.', 404);
    }

    if (existingPlace.business_owner_id !== req.user.id) {
      throw new AppError('Você não tem permissão para excluir este local.', 403);
    }

    await db('places').where({ id }).del();

    return res.status(200).json({
      message: 'Local removido com sucesso!'
    });
  } catch (error) {
    next(error);
  }
}
