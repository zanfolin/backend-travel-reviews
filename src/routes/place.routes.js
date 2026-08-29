import { Router } from 'express';
import {
  listPlaces,
  getPlaceById,
  createPlace,
  updatePlace,
  deletePlace
} from '../controllers/place.controller.js';
import { createReview, listReviews } from '../controllers/review.controller.js';
import { authenticateToken, requireRole, optionalAuth } from '../middlewares/auth.middleware.js';
import { placeImageUpload } from '../config/upload.js';

const router = Router();

// Rotas públicas / viajantes para consulta de locais
router.get('/', optionalAuth, listPlaces);
router.get('/:id', optionalAuth, getPlaceById);

// Rotas exclusivas de gerenciamento de locais para BUSINESS
router.post('/', authenticateToken, requireRole('BUSINESS'), placeImageUpload.single('image'), createPlace);
router.put('/:id', authenticateToken, requireRole('BUSINESS'), placeImageUpload.single('image'), updatePlace);
router.delete('/:id', authenticateToken, requireRole('BUSINESS'), deletePlace);

// Subrotas de avaliações vinculadas ao local
router.get('/:placeId/reviews', listReviews);
router.post('/:placeId/reviews', authenticateToken, requireRole('TRAVELER'), createReview);

export default router;
