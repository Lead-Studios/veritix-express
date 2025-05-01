import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from "typeorm";
import { SpecialSpeaker } from "./special-speaker.entity";

@Entity()
export class Conference {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column()
	title!: string;

	@Column({ nullable: true })
	description?: string;

	@OneToMany(() => SpecialSpeaker, (speaker) => speaker.conference)
	specialSpeakers!: SpecialSpeaker[];
}
