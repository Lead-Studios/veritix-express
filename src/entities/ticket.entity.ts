import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, CreateDateColumn, UpdateDateColumn } from 'typeorm';
import { Event } from './event.entity';

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: 'varchar', length: 255 })
  name!: string;

  @ManyToOne(() => Event, (event) => event.tickets)
  @JoinColumn({ name: 'event_id' })
  event!: Event;

  @Column({ name: 'event_id' })
  eventId!: number;

  @Column({ type: 'integer' })
  quantity!: number;

  @Column({ 
    type: 'decimal', 
    precision: 10, 
    scale: 2,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value)
    }
  })
  price!: number;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'timestamp', name: 'deadline_date' })
  deadlineDate!: Date;

  @Column({ type: 'boolean', name: 'is_reserved', default: false })
  isReserved!: boolean;

  @CreateDateColumn({ name: 'created_at', type: 'timestamp' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamp' })
  updatedAt!: Date;
}