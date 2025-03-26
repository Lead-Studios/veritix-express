import { IsEmail, IsNotEmpty, IsString, MinLength, IsOptional } from "class-validator"

export class CreateAdminDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string

  @IsNotEmpty()
  @IsString()
  firstName!: string

  @IsNotEmpty()
  @IsString()
  lastName!: string

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string

  @IsNotEmpty()
  @IsString()
  roleId!: number
}

export class LoginAdminDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string

  @IsNotEmpty()
  @IsString()
  password!: string
}

export class ForgotPasswordDto {
  @IsNotEmpty()
  @IsEmail()
  email!: string
}

export class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  token!: string

  @IsNotEmpty()
  @IsString()
  @MinLength(8)
  password!: string
}

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  refreshToken!: string
}

export class UpdateProfileDto {
  @IsOptional()
  @IsString()
  firstName?: string

  @IsOptional()
  @IsString()
  lastName?: string
}

