import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';
import { Event } from './event.entity';

@Entity()
export class Referral {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 50, unique: true })
  code!: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'referrer_id' })
  referrer!: User;

  @Column()
  referrer_id!: number;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'referred_user_id' })
  referredUser?: User;

  @Column({ nullable: true })
  referred_user_id?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  totalEarnings!: number;

  @Column({ type: 'integer', default: 0 })
  totalReferrals!: number;

  @Column({ type: 'boolean', default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
