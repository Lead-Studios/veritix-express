import { IsOptional, IsString, IsEnum, IsDate, IsUUID, IsInt } from "class-validator"
import { Type } from "class-transformer"

export enum TimeFilter {
  WEEK = "week",
  MONTH = "month",
  YEAR = "year",
}

export class GetUsersQueryDto {
  @IsOptional()
  @IsString()
  search?: string

  @IsOptional()
  @IsString()
  sortBy?: string

  @IsOptional()
  @IsString()
  sortOrder?: "ASC" | "DESC"

  @IsOptional()
  @Type(() => Number)
  page?: number

  @IsOptional()
  @Type(() => Number)
  limit?: number
}

export class GetUserReportsQueryDto {
  @IsEnum(TimeFilter)
  timeFilter!: TimeFilter

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date
}

export class UserParamDto {
    @IsInt()
    id!: number
}

