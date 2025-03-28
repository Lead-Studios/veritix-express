import { IsNotEmpty, IsUUID, IsString, IsOptional, IsNumber, IsBoolean } from "class-validator"
import { Type } from "class-transformer"

export class CreatePosterDto {
  @IsNotEmpty()
  @Type(() => Number)
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
  @Type(() => Number)
  @IsNumber()
  eventId?: number

  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isActive?: boolean
}

export class PosterParamDto {
  @IsNotEmpty()
  @IsUUID()
  id!: string
}

export class EventParamDto {
  @IsNotEmpty()
  @Type(() => Number)
  @IsNumber()
  eventId!: number
}
