import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';
import { Referral } from './referral.entity';

@Entity()
export class ReferralTransaction {
  @PrimaryGeneratedColumn()
  id!: number;

  @ManyToOne(() => Referral)
  @JoinColumn({ name: 'referral_id' })
  referral!: Referral;

  @Column()
  referral_id!: number;

  @ManyToOne(() => Event)
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @Column()
  event_id!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  ticketAmount!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  rewardAmount!: number;

  @Column({ type: 'varchar', length: 20 })
  status!: 'pending' | 'completed' | 'rejected';

  @Column({ type: 'text', nullable: true })
  rejectionReason?: string;

  @Column({ type: 'timestamp' })
  expiresAt!: Date;

  @CreateDateColumn()
  createdAt!: Date;
}
