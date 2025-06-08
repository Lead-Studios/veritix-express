import express from 'express';
import {
  createCollaborator,
  getAllCollaborators,
  getCollaboratorById,
  updateCollaborator,
  deleteCollaborator,
} from '../controllers/collaboratorController.js';
import { authenticate, authorize } from '../middleware/auth.js';
import {
  validateCollaborator,
  validateMongoId,
  handleValidationErrors,
} from '../middleware/validation';

const router = express.Router();

router.use(authenticate);

router.post(
  '/',
  authorize('organizer', 'admin'),
  validateCollaborator,
  handleValidationErrors,
  createCollaborator
);

router.get('/', getAllCollaborators);

router.get(
  '/:id',
  validateMongoId,
  handleValidationErrors,
  getCollaboratorById
);

router.put(
  '/:id',
  authorize('organizer', 'admin'),
  validateMongoId,
  handleValidationErrors,
  updateCollaborator
);

router.delete(
  '/:id',
  authorize('organizer', 'admin'),
  validateMongoId,
  handleValidationErrors,
  deleteCollaborator
);

export default router;
