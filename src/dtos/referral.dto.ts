import { IsString, IsNumber, IsOptional, IsBoolean, Min, Max } from 'class-validator';

export class CreateReferralDto {
  @IsString()
  code!: string;

  @IsNumber()
  referrer_id!: number;
}

export class UpdateReferralDto {
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}

export class ReferralParamDto {
  @IsString()
  id!: string;
}

export class ConfigureReferralRewardsDto {
  @IsNumber()
  @Min(0)
  @Max(100)
  percentageReward!: number;

  @IsNumber()
  @Min(0)
  minimumTicketAmount!: number;

  @IsNumber()
  @Min(0)
  maximumRewardAmount!: number;
}
