import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn, JoinColumn } from "typeorm"
import { Event } from "./event.entity"

@Entity("posters")
export class Poster {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column()
  filename!: string

  @Column({ nullable: true })
  description!: string

  @Column()
  mimetype!: string

  @Column()
  path!: string

  @Column()
  size!: number

  @Column()
  eventId!: number

  @ManyToOne(() => Event, { onDelete: "CASCADE" })
  @JoinColumn({ name: "eventId" })
  event!: Event

  @Column({ default: true })
  isActive!: boolean

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}
