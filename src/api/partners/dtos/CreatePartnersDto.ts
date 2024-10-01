import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
export class CreatePartnerDto {
  @ApiProperty({
    description: 'Name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email Address',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'Password',
  })
  @IsString()
  password: string;
}
