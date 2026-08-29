import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';

/**
 * Obter todos os estabelecimentos do usuário Business autenticado
 */
export async function getMyPlaces(req, res, next) {
  try {
    const places = await db('places')
      .leftJoin('reviews', 'places.id', 'reviews.place_id')
      .where('places.business_owner_id', req.user.id)
      .select(
        'places.*',
        db.raw('ROUND(AVG(reviews.experience_rating), 1) as average_rating'),
        db.raw('COUNT(reviews.id) as total_reviews'),
        db.raw("SUM(CASE WHEN reviews.owner_reply_text IS NULL AND reviews.id IS NOT NULL THEN 1 ELSE 0 END) as pending_replies")
      )
      .groupBy('places.id')
      .orderBy('places.created_at', 'desc');

    const formatted = places.map((place) => ({
      ...place,
      average_rating: place.average_rating ? parseFloat(place.average_rating) : null,
      total_reviews: parseInt(place.total_reviews, 10) || 0,
      pending_replies: parseInt(place.pending_replies, 10) || 0,
      has_access_ramp: Boolean(place.has_access_ramp),
      has_adapted_bathroom: Boolean(place.has_adapted_bathroom),
      allows_guide_dog: Boolean(place.allows_guide_dog),
      has_braille_signage: Boolean(place.has_braille_signage),
      has_sign_language_interpreter: Boolean(place.has_sign_language_interpreter),
      has_asd_friendly_space: Boolean(place.has_asd_friendly_space)
    }));

    return res.status(200).json({
      total: formatted.length,
      places: formatted
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Painel estatístico / métricas gerais para frontend Web Business
 */
export async function getDashboardStats(req, res, next) {
  try {
    // Locais do proprietário
    const myPlaces = await db('places')
      .where('business_owner_id', req.user.id)
      .select('id', 'establishment_name', 'category');

    const placeIds = myPlaces.map((p) => p.id);

    if (placeIds.length === 0) {
      return res.status(200).json({
        total_places: 0,
        total_reviews: 0,
        average_rating: null,
        pending_replies_count: 0,
        category_distribution: {},
        recent_reviews: []
      });
    }

    // Contagem por categoria
    const categoryDistribution = myPlaces.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {});

    // Estatísticas de avaliações dos locais da empresa
    const reviewStats = await db('reviews')
      .whereIn('place_id', placeIds)
      .select(
        db.raw('COUNT(id) as total_reviews'),
        db.raw('ROUND(AVG(experience_rating), 1) as average_rating'),
        db.raw('SUM(CASE WHEN owner_reply_text IS NULL THEN 1 ELSE 0 END) as pending_replies_count')
      )
      .first();

    // Últimas 5 avaliações recebidas
    const recentReviews = await db('reviews')
      .join('places', 'reviews.place_id', 'places.id')
      .join('users', 'reviews.traveler_id', 'users.id')
      .whereIn('reviews.place_id', placeIds)
      .select(
        'reviews.id',
        'reviews.place_id',
        'places.establishment_name',
        'reviews.experience_rating',
        'reviews.accessibility_level',
        'reviews.comment_text',
        'reviews.owner_reply_text',
        'reviews.created_at',
        'users.full_name as traveler_name',
        'users.profile_picture as traveler_avatar'
      )
      .orderBy('reviews.created_at', 'desc')
      .limit(5);

    return res.status(200).json({
      total_places: myPlaces.length,
      total_reviews: parseInt(reviewStats?.total_reviews || 0, 10),
      average_rating: reviewStats?.average_rating ? parseFloat(reviewStats.average_rating) : null,
      pending_replies_count: parseInt(reviewStats?.pending_replies_count || 0, 10),
      category_distribution: categoryDistribution,
      recent_reviews: recentReviews
    });
  } catch (error) {
    next(error);
  }
}
