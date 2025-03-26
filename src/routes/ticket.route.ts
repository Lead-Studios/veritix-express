import express from 'express';
import { TicketController } from '../controllers/ticket.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateTicket, validateIdParam, validateEventIdParam, validate } from '../validators/ticket.validation';

const router = express.Router();

// router.use(authenticate);

router.post('/', authorize(['admin']), validateTicket, validate, TicketController.createTicket);
router.get('/', TicketController.getAllTickets);
router.get('/:id', validateIdParam, validate, TicketController.getTicketById);
router.get('/events/:eventId/tickets', validateEventIdParam, validate, TicketController.getTicketsByEvent);
router.put('/:id', authorize(['admin']), validateIdParam, validateTicket, validate, TicketController.updateTicket);
router.delete('/:id', authorize(['admin']), validateIdParam, validate, TicketController.deleteTicket);

export default router;