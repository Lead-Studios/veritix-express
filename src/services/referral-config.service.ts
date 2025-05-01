import { AppDataSource } from '../config/database';
import { ReferralConfig } from '../entities/referral-config.entity';
import { ConfigureReferralRewardsDto } from '../dtos/referral.dto';
import { NotFoundError } from '../middlewares/error.middleware';

export class ReferralConfigService {
  private configRepository = AppDataSource.getRepository(ReferralConfig);

  async getActiveConfig(): Promise<ReferralConfig> {
    const config = await this.configRepository.findOne({
      where: { isActive: true },
      order: { updatedAt: 'DESC' }
    });

    if (!config) {
      // Create default config if none exists
      return this.createDefaultConfig();
    }

    return config;
  }

  async updateConfig(dto: ConfigureReferralRewardsDto): Promise<ReferralConfig> {
    // Deactivate current config
    await this.configRepository.update(
      { isActive: true },
      { isActive: false }
    );

    // Create new config
    const newConfig = this.configRepository.create({
      ...dto,
      isActive: true
    });

    return this.configRepository.save(newConfig);
  }

  private async createDefaultConfig(): Promise<ReferralConfig> {
    const defaultConfig = this.configRepository.create({
      percentageReward: 5, // 5%
      minimumTicketAmount: 10, // $10
      maximumRewardAmount: 100, // $100
      maxReferralsPerMonth: 10,
      monthlyRewardCap: 1000, // $1000
      referralExpiryHours: 24,
      isActive: true
    });

    return this.configRepository.save(defaultConfig);
  }

  async validateReferralLimits(userId: number): Promise<boolean> {
    const config = await this.getActiveConfig();
    const firstDayOfMonth = new Date();
    firstDayOfMonth.setDate(1);
    firstDayOfMonth.setHours(0, 0, 0, 0);

    // Check monthly referral count
    const monthlyReferrals = await AppDataSource
      .getRepository('ReferralTransaction')
      .createQueryBuilder('rt')
      .innerJoin('rt.referral', 'r')
      .where('r.referrer_id = :userId', { userId })
      .andWhere('rt.createdAt >= :startDate', { startDate: firstDayOfMonth })
      .andWhere('rt.status = :status', { status: 'completed' })
      .getCount();

    if (monthlyReferrals >= config.maxReferralsPerMonth) {
      return false;
    }

    // Check monthly reward cap
    const monthlyRewards = await AppDataSource
      .getRepository('ReferralTransaction')
      .createQueryBuilder('rt')
      .innerJoin('rt.referral', 'r')
      .where('r.referrer_id = :userId', { userId })
      .andWhere('rt.createdAt >= :startDate', { startDate: firstDayOfMonth })
      .andWhere('rt.status = :status', { status: 'completed' })
      .select('SUM(rt.rewardAmount)', 'total')
      .getRawOne();

    if (monthlyRewards && monthlyRewards.total >= config.monthlyRewardCap) {
      return false;
    }

    return true;
  }
}
