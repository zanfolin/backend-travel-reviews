import { Router } from 'express';
import { getProfile, updateProfile, uploadAvatar } from '../controllers/user.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';
import { avatarUpload } from '../config/upload.js';

const router = Router();

router.use(authenticateToken);

router.get('/profile', getProfile);
router.put('/profile', updateProfile);
router.post('/avatar', avatarUpload.single('avatar'), uploadAvatar);

export default router;
