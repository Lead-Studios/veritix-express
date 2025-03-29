import { IsString, IsOptional, IsBoolean, IsNotEmpty, IsISO8601, IsUrl, Length, IsInt, IsEnum, IsDate, Min, Max } from "class-validator"
import { Type } from "class-transformer"

export enum EventCategory {
  CONFERENCE = "conference",
  WORKSHOP = "workshop",
  SEMINAR = "seminar",
  CONCERT = "concert",
  EXHIBITION = "exhibition",
  OTHER = "other"
}

export class CreateEventDto {
  @IsNotEmpty()
  @IsString()
  @Length(3, 255)
  name!: string

  @IsNotEmpty()
  @IsString()
  @Length(3, 255)
  category!: string

  @IsNotEmpty()
  @IsISO8601()
  eventDate!: string

  @IsNotEmpty()
  @IsISO8601()
  closingDate!: string

  @IsNotEmpty()
  @IsString()
  description!: string

  @IsOptional()
  @IsString()
  image?: string

  @IsOptional()
  @IsBoolean()
  hideLocation?: boolean

  @IsOptional()
  @IsBoolean()
  comingSoon?: boolean

  @IsOptional()
  @IsBoolean()
  transactionCharge?: boolean

  @IsNotEmpty()
  @IsString()
  @Length(2, 255)
  bankName!: string

  @IsNotEmpty()
  @IsString()
  @Length(10, 20)
  accountNumber!: string

  @IsNotEmpty()
  @IsString()
  @Length(3, 255)
  accountName!: string

  @IsOptional()
  @IsUrl()
  facebook?: string

  @IsOptional()
  @IsUrl()
  twitter?: string

  @IsOptional()
  @IsUrl()
  instagram?: string
}

export class UpdateEventDto {
  @IsOptional()
  @IsString()
  @Length(3, 255)
  name?: string

  @IsOptional()
  @IsString()
  @Length(3, 255)
  category?: string

  @IsOptional()
  @IsISO8601()
  eventDate?: string

  @IsOptional()
  @IsISO8601()
  closingDate?: string

  @IsOptional()
  @IsString()
  description?: string

  @IsOptional()
  @IsString()
  image?: string

  @IsOptional()
  @IsBoolean()
  hideLocation?: boolean

  @IsOptional()
  @IsBoolean()
  comingSoon?: boolean

  @IsOptional()
  @IsBoolean()
  transactionCharge?: boolean

  @IsOptional()
  @IsString()
  @Length(2, 255)
  bankName?: string

  @IsOptional()
  @IsString()
  @Length(10, 20)
  accountNumber?: string

  @IsOptional()
  @IsString()
  @Length(3, 255)
  accountName?: string

  @IsOptional()
  @IsUrl()
  facebook?: string

  @IsOptional()
  @IsUrl()
  twitter?: string

  @IsOptional()
  @IsUrl()
  instagram?: string
}

export class EventParamDto {
  @IsInt()
  @Type(() => Number)
  id!: number
}

export class GetEventsQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsEnum(EventCategory)
  category?: EventCategory

  @IsOptional()
  @IsBoolean()
  @Type(() => Boolean)
  comingSoon?: boolean

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date

  @IsOptional()
  @IsString()
  sortBy?: string

  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC'

  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  limit?: number = 10
}
