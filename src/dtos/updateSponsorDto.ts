import { IsOptional, IsString, IsUrl, IsObject } from "class-validator";

export class UpdateSponsorDto {
  @IsOptional()
  @IsString()
  brandImage?: string;

  @IsOptional()
  @IsString()
  brandName?: string;

  @IsOptional()
  @IsUrl()
  brandWebsite?: string;

  @IsOptional()
  @IsObject()
  socialMediaLinks?: {
    facebook?: string;
    twitter?: string;
    instagram?: string;
  };

  @IsOptional()
  eventId?: number;
}