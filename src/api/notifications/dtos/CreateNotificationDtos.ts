import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';

export class CreateNotificationDtos {
  @ApiProperty({
    description: 'Title of the notification',
  })
  @IsString()
  title: string;

  @ApiProperty({
    description: 'Description of the notification',
  })
  @IsString()
  body: string;

  @ApiProperty({
    description: 'Owner of the notification',
  })
  @IsString()
  uid: any;

  @ApiProperty({
    description: 'Item Reference Number',
  })
  @IsString()
  wishReference: string;
}
