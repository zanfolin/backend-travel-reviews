import { Router } from 'express';
import { updateReview, deleteReview, replyToReview } from '../controllers/review.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

router.use(authenticateToken);

// Atualização e exclusão de avaliação pelo viajante autor
router.put('/:id', requireRole('TRAVELER'), updateReview);
router.delete('/:id', requireRole('TRAVELER'), deleteReview);

// Resposta do proprietário de negócio à avaliação recebida
router.patch('/:id/reply', requireRole('BUSINESS'), replyToReview);

export default router;
