import { Router } from 'express';
import { getMyPlaces, getDashboardStats } from '../controllers/business.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';

const router = Router();

// Todas as rotas deste router são restritas a contas BUSINESS verificadas
router.use(authenticateToken, requireRole('BUSINESS'));

router.get('/places', getMyPlaces);
router.get('/stats', getDashboardStats);

export default router;
