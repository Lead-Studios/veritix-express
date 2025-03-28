import express from 'express';
import { authenticate, authorize } from '../middleware/auth.middleware';
import { createEvent, getAllEvents, getEventById, updateEvent, deleteEvent } from '../controller/event.controller';

const router = express.Router();

router.post('/', authenticate, authorize(['admin']), createEvent);
router.get('/', authenticate, getAllEvents);
router.get('/:id', authenticate, getEventById);
router.put('/:id', authenticate, authorize(['admin']), updateEvent);
router.delete('/:id', authenticate, authorize(['admin']), deleteEvent);

export default router;
