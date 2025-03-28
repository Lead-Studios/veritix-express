import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn } from "typeorm"

@Entity("users")
export class User {
  @PrimaryGeneratedColumn("uuid")
  id!: string

  @Column({ unique: true })
  email!: string

  @Column()
  firstName!: string

  @Column()
  lastName!: string

  @Column({ nullable: true })
  phoneNumber!: string

  @Column({ default: false })
  isVerified!: boolean

  @Column({ default: true })
  isActive!: boolean

  @Column({ nullable: true })
  lastLoginAt!: Date

  @CreateDateColumn()
  createdAt!: Date

  @UpdateDateColumn()
  updatedAt!: Date
}

