import { body, param, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

const validateTicket = [
  body('name').notEmpty().withMessage('Ticket name is required'),
  body('eventId').isInt({ min: 1 }).withMessage('Valid event ID is required'),
  body('quantity').isInt({ min: 0 }).withMessage('Quantity must be a positive integer'),
  body('price').isFloat({ min: 0 }).withMessage('Price must be a positive number'),
  body('description').optional().isString(),
  body('deadlineDate').isISO8601().withMessage('Valid deadline date is required'),
  body('isReserved').optional().isBoolean().withMessage('isReserved must be a boolean'),
];

const validateIdParam = [
  param('id').isInt({ min: 1 }).withMessage('Invalid ID format'),
];

const validateEventIdParam = [
  param('eventId').isInt({ min: 1 }).withMessage('Invalid event ID format'),
];

const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};
export {
    validateTicket,
    validateIdParam,
    validateEventIdParam,
    validate,
};
