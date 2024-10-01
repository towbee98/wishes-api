import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsOptional, IsString } from 'class-validator';
import { Users } from 'src/database/models/Users.model';

export enum AuthType {
  OTP = 'otp',
  GOOGLE = 'google',
  INSTAGRAM = 'instagram',
}

export class AuthDto {
  @ApiProperty({
    description: 'phone number ',
  })
  @IsOptional()
  @IsString()
  phoneNumber: string;

  @ApiProperty({
    description: 'Authentication types',
  })
  @IsEnum(AuthType)
  type: AuthType;

  @ApiProperty({ description: 'Google ID token' })
  @IsOptional()
  @IsString()
  googleIdToken: string;
}

export class AdminAuth {
  @ApiProperty({
    description: 'email address',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Password',
  })
  @IsString()
  password: string;
}

export class AuthenticatedAccountDto {
  user: Users;
  token: string;
  otpRequired: boolean;
  isFullNameRequired: boolean;
}

export class VerifyTokenDto {
  @ApiProperty({
    description: 'OTP code',
  })
  @IsString()
  code: string;

  @ApiProperty({
    description: 'Phone number',
  })
  @IsString()
  phoneNumber: string;
}

export class ResendTokenDto {
  @ApiProperty({
    description: 'OTP code',
  })
  @IsString()
  phoneNumber: string;
}

export class UpdateFirstNameDto {
  @ApiProperty({
    description: 'First name',
  })
  @IsString()
  firstName: string;
}
