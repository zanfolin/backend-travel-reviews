import { Router } from 'express';
import authRoutes from './auth.routes.js';
import userRoutes from './user.routes.js';
import placeRoutes from './place.routes.js';
import reviewRoutes from './review.routes.js';
import businessRoutes from './business.routes.js';

const router = Router();

// Health check route
router.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'AccessTrip API'
  });
});

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/places', placeRoutes);
router.use('/reviews', reviewRoutes);
router.use('/business', businessRoutes);

export default router;
