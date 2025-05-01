import { AppDataSource } from '../config/database';
import { Referral } from '../entities/referral.entity';
import { ReferralTransaction } from '../entities/referral-transaction.entity';
import { User } from '../entities/user.entity';
import { Event } from '../entities/event.entity';
import { CreateReferralDto, UpdateReferralDto, ConfigureReferralRewardsDto } from '../dtos/referral.dto';
import { generateUniqueCode } from '../utils/referral.utils';
import { BadRequestError, NotFoundError } from '../middlewares/error.middleware';
import { ReferralConfigService } from './referral-config.service';
import { addHours } from '../utils/date.utils';
import { FindOptionsWhere } from 'typeorm';

export class ReferralService {
  private referralRepository = AppDataSource.getRepository(Referral);
  private transactionRepository = AppDataSource.getRepository(ReferralTransaction);
  private userRepository = AppDataSource.getRepository(User);
  private eventRepository = AppDataSource.getRepository(Event);
  private configService = new ReferralConfigService();

  async generateReferralCode(userId: number): Promise<string> {
    let code = await generateUniqueCode();
    let exists = true;

    while (exists) {
      const referral = await this.referralRepository.findOne({
        where: { code }
      });
      if (!referral) {
        exists = false;
      } else {
        code = await generateUniqueCode();
      }
    }

    return code;
  }

  async createReferral(dto: CreateReferralDto): Promise<Referral> {
    const existingReferral = await this.referralRepository.findOne({
      where: { code: dto.code }
    });

    if (existingReferral) {
      throw new BadRequestError('Referral code already exists');
    }

    const referrer = await this.userRepository.findOne({
      where: { id: dto.referrer_id.toString() } as FindOptionsWhere<User>
    });

    if (!referrer) {
      throw new NotFoundError('Referrer not found');
    }

    const referral = this.referralRepository.create({
      ...dto,
      referrer
    });

    return this.referralRepository.save(referral);
  }

  async processReferral(
    code: string,
    userId: number,
    eventId: number,
    ticketAmount: number
  ): Promise<ReferralTransaction> {
    const referral = await this.referralRepository.findOne({
      where: { code, isActive: true },
      relations: ['referrer']
    });

    if (!referral) {
      throw new NotFoundError('Invalid or inactive referral code');
    }

    // Prevent self-referrals
    if (referral.referrer_id === userId) {
      throw new BadRequestError('Self-referrals are not allowed');
    }

    // Check referral limits
    const withinLimits = await this.configService.validateReferralLimits(referral.referrer_id);
    if (!withinLimits) {
      throw new BadRequestError('Referral limits exceeded for this month');
    }

    const event = await this.eventRepository.findOne({
      where: { id: eventId }
    });

    if (!event) {
      throw new NotFoundError('Event not found');
    }

    // Get active config for reward calculation
    const config = await this.configService.getActiveConfig();

    // Validate minimum ticket amount
    if (ticketAmount < config.minimumTicketAmount) {
      throw new BadRequestError(`Minimum ticket amount for referral is $${config.minimumTicketAmount}`);
    }

    // Calculate reward based on configured rules
    const rewardAmount = this.calculateReward(ticketAmount, config);

    const transaction = this.transactionRepository.create({
      referral,
      event,
      ticketAmount,
      rewardAmount,
      status: 'pending',
      expiresAt: addHours(new Date(), config.referralExpiryHours)
    });

    await this.transactionRepository.save(transaction);

    // Update referral statistics
    referral.totalReferrals += 1;
    referral.totalEarnings = Number(referral.totalEarnings) + Number(rewardAmount);
    await this.referralRepository.save(referral);

    return transaction;
  }

  private calculateReward(ticketAmount: number, config: any): number {
    const calculatedReward = (ticketAmount * config.percentageReward) / 100;
    return Math.min(calculatedReward, config.maximumRewardAmount);
  }

  async getReferralsByUser(userId: number): Promise<Referral[]> {
    return this.referralRepository.find({
      where: { referrer_id: userId },
      relations: ['referredUser']
    });
  }

  async getReferralTransactions(referralId: number): Promise<ReferralTransaction[]> {
    return this.transactionRepository.find({
      where: { referral_id: referralId },
      relations: ['event'],
      order: { createdAt: 'DESC' }
    });
  }

  async updateReferral(id: number, dto: UpdateReferralDto): Promise<Referral> {
    const referral = await this.referralRepository.findOne({
      where: { id }
    });

    if (!referral) {
      throw new NotFoundError('Referral not found');
    }

    Object.assign(referral, dto);
    return this.referralRepository.save(referral);
  }
}
