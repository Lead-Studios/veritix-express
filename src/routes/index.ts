import express from 'express';
import adminRoutes from './admin.routes';
import eventRoutes from './event.routes';
import ticketRoutes from './ticket.route';

const router = express.Router();

router.use('/admin', adminRoutes);
router.use('/event', eventRoutes);
router.use('/ticket', ticketRoutes);


export default router;