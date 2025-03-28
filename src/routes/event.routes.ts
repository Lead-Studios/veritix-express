import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateDto } from '../middlewares/validate.middleware';
import { validateParamDto } from '../middlewares/validateParam.middleware';
import { CreateEventDto, UpdateEventDto, EventParamDto } from '../dtos/event.dto';
import { EventController } from '../controllers/event.controller';
import { PosterController } from '../controllers/poster.controller';

const router = Router();
const eventController = new EventController();
const posterController = new PosterController();

// Create event
router.post(
  '/',
  authenticate,
  authorize(['admin', 'event_manager']),
  validateDto(CreateEventDto),
  eventController.createEvent
);

// Get all events
router.get('/', eventController.getAllEvents);

// Get event by ID
router.get(
  '/:id',
  validateParamDto(EventParamDto),
  eventController.getEventById
);

// Update event
router.put(
  '/:id',
  authenticate,
  authorize(['admin', 'event_manager']),
  validateParamDto(EventParamDto),
  validateDto(UpdateEventDto),
  eventController.updateEvent
);

// Delete event
router.delete(
  '/:id',
  authenticate,
  authorize(['admin', 'event_manager']),
  validateParamDto(EventParamDto),
  eventController.deleteEvent
);

// Get all posters for a specific event
router.get(
  "/:id/posters",
  authenticate,
  validateParamDto(EventParamDto),
  posterController.getPostersByEventId
)

export default router;
