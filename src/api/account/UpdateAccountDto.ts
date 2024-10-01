import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDefined,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
  ValidationOptions,
  registerDecorator,
} from 'class-validator';

function IsImageFile(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'isImageFile',
      target: object.constructor,
      propertyName: propertyName,
      constraints: [],
      options: validationOptions,
      validator: {
        validate(value: any) {
          if (!value) {
            return true; // No file uploaded, so it's valid
          }

          if (!(value instanceof File)) {
            return false; // Not a File object
          }

          // const allowedTypes = ['image/png', 'image/jpeg'];

          // if (allowedTypes.includes(value.type)) {
          //   return true;
          // }

          return true;
        },
      },
    });
  };
}

export class UploadFileDto {
  @IsDefined()
  @IsNotEmpty()
  @IsString()
  @IsImageFile({ message: 'Only PNG and JPEG images are allowed.' })
  file: Express.Multer.File;
}

export class UpdateAccountDto {
  @ApiProperty({
    description: 'username ',
  })
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'First Name ',
  })
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
  })
  @IsOptional()
  @IsString()
  lastName: string;

  @ApiProperty({
    description: 'Address ',
  })
  @IsOptional()
  @IsString()
  address: string;

  @ApiProperty({
    description: 'Address ',
  })
  @IsOptional()
  @IsString()
  wishDescription: string;
}

export class UpdateShippingDto {
  @ApiProperty({
    description: 'Address 1',
  })
  @IsOptional()
  @IsString()
  streetAddress1: string;

  @ApiProperty({
    description: 'Address 2',
  })
  @IsOptional()
  @IsString()
  streetAddress2: string;

  @ApiProperty({
    description: 'City address',
  })
  @IsOptional()
  @IsString()
  city: string;

  @ApiProperty({
    description: 'State / Province address',
  })
  @IsOptional()
  @IsString()
  state: string;

  @ApiProperty({
    description: 'Postal code',
  })
  @IsOptional()
  @IsString()
  postalCode: string;

  @ApiProperty({
    description: 'Country',
  })
  @IsOptional()
  @IsString()
  country: string;

  @ApiProperty({
    description: 'First Name ',
  })
  @IsOptional()
  @IsString()
  firstName: string;

  @ApiProperty({
    description: 'Last name',
  })
  @IsOptional()
  @IsString()
  lastName: string;
}

export class UpdateNotification {
  @ApiProperty({
    description: 'Item price change',
  })
  @IsOptional()
  @IsBoolean()
  items_price_change: false;

  @ApiProperty({
    description: 'Item available',
  })
  @IsOptional()
  @IsBoolean()
  items_available: false;

  @ApiProperty({
    description: 'Item available',
  })
  @IsOptional()
  @IsBoolean()
  items_purchase: false;

  @ApiProperty({
    description: 'Item available',
  })
  @IsOptional()
  @IsBoolean()
  visibility: false;

  @ApiProperty({
    description: 'Pause  all',
  })
  @IsOptional()
  @IsBoolean()
  pause_all: false;
}

export class SettingsUpdateDto {
  @ApiProperty({
    description: 'Username',
  })
  @IsOptional()
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Notification options',
  })
  @IsOptional()
  @IsObject()
  notifications: UpdateNotification;

  @ApiProperty({
    description: 'Username',
  })
  @IsOptional()
  @IsObject()
  address: UpdateShippingDto;
}

export class OrderDto {
  @ApiProperty({
    description: 'orderNumber',
  })
  @IsString()
  orderNumber: string;
}
