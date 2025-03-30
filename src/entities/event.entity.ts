import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from "typeorm";
import { Poster } from "./poster.entity";

@Entity()
export class Event {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "varchar", length: 255 })
  name!: string;

  @Column({ type: "varchar", length: 255 })
  category!: string;

  @Column({ type: "timestamp" })
  eventDate!: Date;

  @Column({ type: "timestamp" })
  closingDate!: Date;

  @Column({ type: "text" })
  description!: string;

  @Column({ type: "varchar", length: 255 })
  image!: string;

  @Column({ type: "boolean", default: false })
  hideLocation!: boolean;

  @Column({ type: "boolean", default: false })
  comingSoon!: boolean;

  @Column({ type: "boolean", default: false })
  transactionCharge!: boolean;

  @Column({ type: "varchar", length: 255 })
  bankName!: string;

  @Column({ type: "varchar", length: 20 })
  accountNumber!: string;

  @Column({ type: "varchar", length: 255 })
  accountName!: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  facebook?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  twitter?: string;

  @Column({ type: "varchar", length: 255, nullable: true })
  instagram?: string;

  @OneToMany(() => Poster, (poster) => poster.event)
  posters?: Poster[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @Column({ default: false })
  archived!: boolean; // New field for archiving events
}
