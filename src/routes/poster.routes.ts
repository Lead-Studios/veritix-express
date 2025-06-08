import { Router } from 'express';
import { PosterController } from '../controllers/poster.controller';
import { authenticateToken, requireRole } from '../middleware/auth.middleware';
import { upload } from '../config/multer';
import {
  validateCreatePoster,
  validateUpdatePoster,
  validatePosterParams,
  handleValidationErrors,
} from '../middleware/validation.middleware';

const router = Router();
const posterController = new PosterController();

router.post(
  '/',
  authenticateToken,
  requireRole(['admin', 'organizer']),
  upload.single('posterImage'),
  validateCreatePoster,
  handleValidationErrors,
  posterController.createPoster.bind(posterController)
);

router.get(
  '/',
  authenticateToken,
  posterController.getAllPosters.bind(posterController)
);

router.get(
  '/:id',
  authenticateToken,
  validatePosterParams,
  handleValidationErrors,
  posterController.getPosterById.bind(posterController)
);

router.put(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'organizer']),
  validateUpdatePoster,
  handleValidationErrors,
  posterController.updatePoster.bind(posterController)
);

router.delete(
  '/:id',
  authenticateToken,
  requireRole(['admin', 'organizer']),
  validatePosterParams,
  handleValidationErrors,
  posterController.deletePoster.bind(posterController)
);

export default router;
