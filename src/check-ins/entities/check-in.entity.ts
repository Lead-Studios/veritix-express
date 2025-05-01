import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn } from "typeorm"
import { Ticket } from "../../tickets/entities/ticket.entity"
import { User } from "../../users/entities/user.entity"

@Entity()
export class CheckIn {
  @PrimaryGeneratedColumn("uuid")
  id: string

  @ManyToOne(
    () => Ticket,
    (ticket) => ticket.checkIns,
  )
  ticket: Ticket

  @ManyToOne(() => User)
  scannedBy: User

  @Column({ nullable: true })
  location: string

  @Column({ default: false })
  isOffline: boolean

  @CreateDateColumn()
  createdAt: Date
}

