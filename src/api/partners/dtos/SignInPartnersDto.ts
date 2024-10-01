import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class SignInPartnerDto {
  @ApiProperty({
    description: 'domain address',
  })
  @IsString()
  domain: string;

  @ApiProperty({
    description: 'Password',
  })
  @IsString()
  password: string;
}
