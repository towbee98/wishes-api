import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { NotificationsService } from './notifications.service';
import { APIResponse } from 'src/types/APIResponse';
import { AuthUser } from 'src/decorators/auth';
import { CreateNotificationDtos } from './dtos/CreateNotificationDtos';

@Controller('notifications')
@ApiTags('notifications')
export class NotificationsController {
  constructor(private readonly notificationService: NotificationsService) {}

  @Post('/')
  async createNotification(@Body() body: CreateNotificationDtos) {
    const notification = await this.notificationService.createNotifications(
      body,
    );
    return new APIResponse<any>(notification);
  }

  @Get('/')
  async notifications(@AuthUser() authUser) {
    const notification = await this.notificationService.notifications(
      authUser._id,
    );
    return new APIResponse<any>(notification);
  }
}
