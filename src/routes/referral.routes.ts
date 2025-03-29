import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware';
import { validateDto } from '../middlewares/validate.middleware';
import { validateParamDto } from '../middlewares/validateParam.middleware';
import { ReferralController } from '../controllers/referral.controller';
import { ReferralParamDto, UpdateReferralDto } from '../dtos/referral.dto';

const router = Router();
const referralController = new ReferralController();

// Generate referral code for authenticated user
router.post(
  '/generate',
  authenticate,
  referralController.generateReferralCode
);

// Process a referral when purchasing tickets
router.post(
  '/process',
  authenticate,
  referralController.processReferral
);

// Get user's referrals
router.get(
  '/my-referrals',
  authenticate,
  referralController.getUserReferrals
);

// Get referral transactions
router.get(
  '/:id/transactions',
  authenticate,
  validateParamDto(ReferralParamDto),
  referralController.getReferralTransactions
);

// Update referral (admin only)
router.put(
  '/:id',
  authenticate,
  authorize(['admin']),
  validateParamDto(ReferralParamDto),
  validateDto(UpdateReferralDto),
  referralController.updateReferral
);

export default router;
