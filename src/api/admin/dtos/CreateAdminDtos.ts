import { ApiProperty } from '@nestjs/swagger';
import { File } from 'buffer';
import { IsArray, IsString } from 'class-validator';

export class CreateAdminDtos {
  @ApiProperty({
    description: 'firstName',
  })
  @IsString({})
  firstName: string;

  @ApiProperty({
    description: 'lastName',
  })
  @IsString()
  lastName: string;

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

  @ApiProperty({
    description: 'Roles',
  })
  @IsArray()
  @IsString({ each: true })
  roles: [string];
}

export class UpdateAdminDtos {
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
}

export class UpdatePasswordDtos {
  @ApiProperty({
    description: 'Password',
  })
  @IsString()
  password: string;
}

export class StoreDto {
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
    description: 'files',
  })
  files: [Express.Multer.File];

  @ApiProperty({
    description: 'description',
  })
  @IsString()
  description: string;

  @ApiProperty({
    description: 'category',
  })
  @IsString()
  category: string;

  @ApiProperty({
    description: 'link',
  })
  @IsString()
  link: string;
}

export class PasswordDto {
  @ApiProperty({
    description: 'Old Password',
  })
  @IsString()
  oldPassword: string;
  @ApiProperty({
    description: 'New Password',
  })
  @IsString()
  newPassword: string;
  @ApiProperty({
    description: 'Confirm New Password',
  })
  @IsString()
  confirmNewPassword: string;
}
