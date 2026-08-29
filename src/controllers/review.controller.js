import db from '../../database/connection.js';
import { AppError } from '../middlewares/error.middleware.js';

const VALID_ACCESSIBILITY_LEVELS = ['POOR', 'GOOD', 'EXCELLENT'];

/**
 * Criar avaliação de um local (Exclusivo para TRAVELER)
 */
export async function createReview(req, res, next) {
  try {
    const { placeId } = req.params;
    const { experience_rating, accessibility_level, comment_text } = req.body;

    if (!experience_rating || !accessibility_level) {
      throw new AppError('Nota da experiência (1 a 5) e nível de acessibilidade são obrigatórios.', 400);
    }

    const ratingNum = parseInt(experience_rating, 10);
    if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
      throw new AppError('A nota da experiência deve ser um número inteiro entre 1 e 5.', 400);
    }

    const levelUpper = accessibility_level.toUpperCase();
    if (!VALID_ACCESSIBILITY_LEVELS.includes(levelUpper)) {
      throw new AppError(
        `Nível de acessibilidade inválido. Opções permitidas: ${VALID_ACCESSIBILITY_LEVELS.join(', ')}`,
        400
      );
    }

    // Verificar se o local existe
    const place = await db('places').where({ id: placeId }).first();
    if (!place) {
      throw new AppError('Local não encontrado para avaliação.', 404);
    }

    const [reviewId] = await db('reviews').insert({
      place_id: placeId,
      traveler_id: req.user.id,
      experience_rating: ratingNum,
      accessibility_level: levelUpper,
      comment_text: comment_text?.trim() || null,
      owner_reply_text: null
    });

    const createdReview = await db('reviews')
      .join('users', 'reviews.traveler_id', 'users.id')
      .select(
        'reviews.*',
        'users.full_name as traveler_name',
        'users.profile_picture as traveler_avatar'
      )
      .where('reviews.id', reviewId)
      .first();

    return res.status(201).json({
      message: 'Avaliação enviada com sucesso!',
      review: createdReview
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Listar avaliações de um local
 */
export async function listReviews(req, res, next) {
  try {
    const { placeId } = req.params;

    const reviews = await db('reviews')
      .join('users', 'reviews.traveler_id', 'users.id')
      .select(
        'reviews.*',
        'users.full_name as traveler_name',
        'users.profile_picture as traveler_avatar'
      )
      .where('reviews.place_id', placeId)
      .orderBy('reviews.created_at', 'desc');

    return res.status(200).json({
      total: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Atualizar avaliação feita pelo viajante
 */
export async function updateReview(req, res, next) {
  try {
    const { id } = req.params;
    const { experience_rating, accessibility_level, comment_text } = req.body;

    const review = await db('reviews').where({ id }).first();
    if (!review) {
      throw new AppError('Avaliação não encontrada.', 404);
    }

    if (review.traveler_id !== req.user.id) {
      throw new AppError('Você só pode editar suas próprias avaliações.', 403);
    }

    const updateData = {};
    if (experience_rating !== undefined) {
      const ratingNum = parseInt(experience_rating, 10);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        throw new AppError('Nota da experiência deve estar entre 1 e 5.', 400);
      }
      updateData.experience_rating = ratingNum;
    }

    if (accessibility_level !== undefined) {
      const levelUpper = accessibility_level.toUpperCase();
      if (!VALID_ACCESSIBILITY_LEVELS.includes(levelUpper)) {
        throw new AppError(`Nível de acessibilidade inválido: ${VALID_ACCESSIBILITY_LEVELS.join(', ')}`, 400);
      }
      updateData.accessibility_level = levelUpper;
    }

    if (comment_text !== undefined) {
      updateData.comment_text = comment_text.trim() || null;
    }

    await db('reviews').where({ id }).update(updateData);

    const updated = await db('reviews').where({ id }).first();

    return res.status(200).json({
      message: 'Avaliação atualizada com sucesso!',
      review: updated
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Excluir avaliação pelo viajante
 */
export async function deleteReview(req, res, next) {
  try {
    const { id } = req.params;

    const review = await db('reviews').where({ id }).first();
    if (!review) {
      throw new AppError('Avaliação não encontrada.', 404);
    }

    if (review.traveler_id !== req.user.id) {
      throw new AppError('Você só pode remover suas próprias avaliações.', 403);
    }

    await db('reviews').where({ id }).del();

    return res.status(200).json({
      message: 'Avaliação removida com sucesso!'
    });
  } catch (error) {
    next(error);
  }
}

/**
 * Responder à avaliação (Exclusivo para o proprietário BUSINESS do local avaliado)
 */
export async function replyToReview(req, res, next) {
  try {
    const { id } = req.params;
    const { owner_reply_text } = req.body;

    if (!owner_reply_text || !owner_reply_text.trim()) {
      throw new AppError('O texto de resposta é obrigatório.', 400);
    }

    const review = await db('reviews')
      .join('places', 'reviews.place_id', 'places.id')
      .select('reviews.id', 'places.business_owner_id', 'places.establishment_name')
      .where('reviews.id', id)
      .first();

    if (!review) {
      throw new AppError('Avaliação não encontrada.', 404);
    }

    if (review.business_owner_id !== req.user.id) {
      throw new AppError('Apenas o proprietário deste estabelecimento pode responder a esta avaliação.', 403);
    }

    await db('reviews').where({ id }).update({
      owner_reply_text: owner_reply_text.trim()
    });

    const updatedReview = await db('reviews').where({ id }).first();

    return res.status(200).json({
      message: 'Resposta registrada com sucesso!',
      review: updatedReview
    });
  } catch (error) {
    next(error);
  }
}
