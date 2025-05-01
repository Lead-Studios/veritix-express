import {
	IsNotEmpty,
	IsOptional,
	IsString,
	IsUUID,
	IsNumber,
	IsUrl,
} from "class-validator";
import { Type } from "class-transformer";

export class CreateSpecialSpeakerDto {
	@IsNotEmpty()
	@IsString()
	name!: string;

	@IsNotEmpty()
	@Type(() => Number)
	@IsNumber()
	conferenceId!: number;

	@IsOptional()
	@IsUrl()
	facebook?: string;

	@IsOptional()
	@IsUrl()
	twitter?: string;

	@IsOptional()
	@IsUrl()
	instagram?: string;
}

export class UpdateSpecialSpeakerDto {
	@IsOptional()
	@IsString()
	name?: string;

	@IsOptional()
	@Type(() => Number)
	@IsNumber()
	conference?: number;

	@IsOptional()
	@IsUrl()
	facebook?: string;

	@IsOptional()
	@IsUrl()
	twitter?: string;

	@IsOptional()
	@IsUrl()
	instagram?: string;
}

export class SpecialSpeakerParamDto {
	@IsNotEmpty()
	@IsUUID()
	id!: string;
}

export class ConferenceParamDto {
	@IsNotEmpty()
	@Type(() => Number)
	@IsNumber()
	conferenceId!: number;
}
