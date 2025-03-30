import { IsString, IsUUID, IsOptional, IsBoolean } from "class-validator"

export class CreateCheckInDto {
  @IsString()
  qrCodeData: string

  @IsUUID()
  scannedById: string

  @IsString()
  @IsOptional()
  location?: string

  @IsBoolean()
  @IsOptional()
  isOffline?: boolean
}

