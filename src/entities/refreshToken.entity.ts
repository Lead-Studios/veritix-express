import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from "typeorm"
import { Admin } from "./admin.entity"

@Entity("refresh_tokens")
export class RefreshToken {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column()
  token!: string

  @Column()
  expiresAt!: Date

  @ManyToOne(() => Admin)
  @JoinColumn()
  admin!: Admin

  @CreateDateColumn()
  createdAt!: Date
}

