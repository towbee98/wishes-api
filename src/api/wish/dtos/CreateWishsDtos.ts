import { ApiProperty } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';

export class StoreInfo {
  @ApiProperty({
    description: 'Store Name ',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Email address ',
  })
  @IsString()
  email: string;
}

export class StoreSettingsDto {
  @ApiProperty({
    description: 'color'
  })
  @IsObject()
  color: Object

  @ApiProperty({
    description: 'size of the button'
  })
  @IsString()
  size: string

  @ApiProperty({
    description: 'store token'
  })
  @IsString()
  id_token: string
}


export class SupportDto {
  @ApiProperty({
    description: 'Subject of issue '
  })
  @IsString()
  subject: string

  @ApiProperty({
    description: 'description of issue'
  })
  @IsString()
  description: string

  @ApiProperty({
    description: 'store token'
  })
  @IsString()
  id_token: string
}


export class CreateWishsDto {
  @ApiProperty({
    description: 'Provider for the service',
  })
  @IsString()
  provider: string;

  @ApiProperty({
    description: 'Provider for the service',
  })
  @IsOptional()
  productVariant;

  @ApiProperty({
    description: 'Product id',
  })
  @IsString()
  item_id: string;

  @ApiProperty({
    description: 'Product name',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Status of product',
  })
  @IsBoolean()
  status: boolean;

  @ApiProperty({
    description: 'Product image',
  })
  @IsString()
  image: string;

  @ApiProperty({
    description: 'Product amount',
  })
  @IsNumber()
  amount: number;

  @ApiProperty({
    description: 'Vendor',
  })
  @IsString()
  vendor: string;

  @ApiProperty({
    description: 'Product description',
  })
  @IsOptional()
  @IsString()
  description: string;

  @ApiProperty({
    description: 'All product ',
  })
  @IsObject()
  orderData: object;

  @ApiProperty({
    description: 'Store Information ',
  })
  @IsObject()
  store: StoreInfo;
}

export class SortWishDto {
  @ApiProperty({
    description: 'dto sort',
  })
  @IsObject()
  sort: Record<string, number>;
}

export class PriorityDto {
  @ApiProperty({
    description: 'Wish item id',
  })
  @IsString()
  wish_id: string;
}

export class HideWishDto {
  @ApiProperty({
    description: 'Wish item id',
  })
  @IsString()
  id: string;
}
export class UpdateWishPoDescription {
  @ApiProperty({
    description: 'Wish description',
  })
  @IsString()
  description: string;
}

export class InitCheckout {
  @ApiProperty({
    description: '_id from the wishpo list',
  })
  @IsString()
  wish_id: string;
}

export class CompleteCheckout {
  @ApiProperty({
    description: 'Checkout Id',
  })
  @IsString()
  @IsOptional()
  id: string;

  @ApiProperty({
    description: 'Personalized Message',
  })
  @IsString()
  @IsOptional()
  personalized_message: string;

  @ApiProperty({
    description: 'Email Address',
  })
  @IsString()
  @IsOptional()
  email: string;

  @ApiProperty({
    description: 'First Name',
  })
  @IsString()
  @IsOptional()
  first_name: string;

  @ApiProperty({
    description: 'Last Name',
  })
  @IsString()
  @IsOptional()
  last_name: string;

  @ApiProperty({
    description: 'Last Name',
  })
  @IsBoolean()
  @IsOptional()
  is_anonymous: string;
}
export class IFulfillOrder extends InitCheckout {
  //
}
