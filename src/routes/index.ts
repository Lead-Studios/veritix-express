import express from 'express';
import adminRoutes from './admin.routes';
import eventRoutes from './event.routes';
import ticketRoutes from './ticket.route';

const router = express.Router();

router.use('/admin', adminRoutes);
router.use('/events', eventRoutes);
router.use('/tickets', ticketRoutes);


export default router;