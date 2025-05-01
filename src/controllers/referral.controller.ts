import { Request, Response, NextFunction } from 'express';
import { ReferralService } from '../services/referral.service';
import { CreateReferralDto, UpdateReferralDto, ConfigureReferralRewardsDto } from '../dtos/referral.dto';
import { isValidReferralCode } from '../utils/referral.utils';

export class ReferralController {
  private referralService: ReferralService;

  constructor() {
    this.referralService = new ReferralService();
  }

  generateReferralCode = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const code = await this.referralService.generateReferralCode(userId);
      
      const referral = await this.referralService.createReferral({
        code,
        referrer_id: userId
      });

      res.status(201).json({
        success: true,
        data: referral
      });
    } catch (error) {
      next(error);
    }
  };

  processReferral = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { code, eventId, ticketAmount } = req.body;
      const userId = (req as any).user.id;

      if (!isValidReferralCode(code)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid referral code format'
        });
      }

      const transaction = await this.referralService.processReferral(
        code,
        userId,
        eventId,
        ticketAmount
      );

      res.status(200).json({
        success: true,
        data: transaction
      });
    } catch (error) {
      next(error);
    }
  };

  getUserReferrals = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user.id;
      const referrals = await this.referralService.getReferralsByUser(userId);

      res.status(200).json({
        success: true,
        data: referrals
      });
    } catch (error) {
      next(error);
    }
  };

  getReferralTransactions = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const transactions = await this.referralService.getReferralTransactions(Number(id));

      res.status(200).json({
        success: true,
        data: transactions
      });
    } catch (error) {
      next(error);
    }
  };

  updateReferral = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { id } = req.params;
      const dto = req.body as UpdateReferralDto;
      
      const referral = await this.referralService.updateReferral(Number(id), dto);

      res.status(200).json({
        success: true,
        data: referral
      });
    } catch (error) {
      next(error);
    }
  };
}
