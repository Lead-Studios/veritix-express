import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, CreateDateColumn, UpdateDateColumn } from "typeorm"
import { Role } from "./role.entity"

@Entity()
export class Admin {
  @PrimaryGeneratedColumn()
  id!: number

  @Column()
  name!: string

  @Column({ unique: true })
  email!: string

  @Column()
  firstName!: string

  @Column()
  lastName!: string

  @Column({ nullable: true })
  profileImage!: string
  @Column()
  password!: string

  @ManyToOne(() => Role, (role) => role.admins, { eager: true })
  role!: Role

  @Column({ nullable: true })
  passwordResetToken!: string

  @Column({ type: "timestamp", nullable: true })
  passwordResetExpires!: Date

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}