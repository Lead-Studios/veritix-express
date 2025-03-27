import { Entity, PrimaryGeneratedColumn, Column } from "typeorm";

@Entity()
export class Sponsor {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  brandImage!: string;

  @Column()
  brandName!: string;

  @Column()
  brandWebsite!: string;

  @Column("jsonb")
  socialMediaLinks!: {
    facebook: string;
    twitter: string;
    instagram: string;
  };

  @Column()
  eventId!: number;
}