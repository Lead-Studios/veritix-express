import { IsNotEmpty, IsUUID, IsString, IsOptional, IsNumber } from "class-validator"

export class CreatePosterDto {
  @IsNotEmpty()
  @IsNumber()
  eventId!: number

  @IsOptional()
  @IsString()
  description?: string
}

export class UpdatePosterDto {
  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsNumber()
  eventId?: number

  @IsOptional()
  @IsString()
  isActive?: boolean
}

export class PosterParamDto {
  @IsNotEmpty()
  @IsUUID()
  id!: string
}

export class EventParamDto {
  @IsNotEmpty()
  @IsNumber()
  eventId!: number
}
