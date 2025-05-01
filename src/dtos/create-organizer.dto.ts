import { IsString, IsEmail, Length } from "class-validator";

export class CreateOrganizerDto {
	@IsString()
	@Length(3, 100)
	name!: string;

	@IsEmail()
	email!: string;
}
