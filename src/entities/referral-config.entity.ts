import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from 'typeorm';

@Entity()
export class ReferralConfig {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'decimal', precision: 5, scale: 2 })
  percentageReward!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  minimumTicketAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  maximumRewardAmount!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @Column({ type: 'integer', default: 10 })
  maxReferralsPerMonth!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 1000 })
  monthlyRewardCap!: number;

  @Column({ type: 'integer', default: 24 })
  referralExpiryHours!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
