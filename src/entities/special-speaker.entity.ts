import { Entity, Column, PrimaryGeneratedColumn, ManyToOne } from "typeorm";
import { Conference } from "./conference.entity";

@Entity()
export class SpecialSpeaker {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	name!: string;

	@Column()
	image!: string;

	@ManyToOne(() => Conference, (conference) => conference.specialSpeakers)
	conference!: Conference;

	@Column({ nullable: true })
	facebook?: string;

	@Column({ nullable: true })
	twitter?: string;

	@Column({ nullable: true })
	instagram?: string;
}
