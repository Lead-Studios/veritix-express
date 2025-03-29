import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from "typeorm"
import { User } from "../../users/entities/user.entity"
import { Event } from "../../events/entities/event.entity"
import { CheckIn } from "../../check-ins/entities/check-in.entity"

@Entity()
export class Ticket {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @Column({ unique: true })
  qrCode: string

  @Column({ default: false })
  isUsed: boolean

  @ManyToOne(
    () => User,
    (user) => user.tickets,
  )
  user: User

  @ManyToOne(
    () => Event,
    (event) => event.tickets,
  )
  event: Event

  @OneToMany(
    () => CheckIn,
    (checkIn) => checkIn.ticket,
  )
  checkIns: CheckIn[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

