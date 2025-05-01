import { Entity, Column, PrimaryGeneratedColumn } from "typeorm";

@Entity()
export class Organizer {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ unique: true })
	email!: string;

	@Column()
	password!: string;

	@Column()
	name!: string;

	@Column({ default: "organizer" })
	role!: string;
}
