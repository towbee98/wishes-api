import { BadRequestException, Injectable } from '@nestjs/common';
import mongoose, { Model } from 'mongoose';
import {
  NotificationDocument,
  Notifications,
} from 'src/database/models/Notifications.model';
import { CreateNotificationDtos } from './dtos/CreateNotificationDtos';
import { InjectModel } from '@nestjs/mongoose';
import { Wishs, WishsDocument } from 'src/database/models/Wishs.model';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectModel(Notifications.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Wishs.name)
    private readonly wishModel: Model<WishsDocument>,
  ) {}

  async createNotifications(createNotificationDto: CreateNotificationDtos) {
    const checkWishItem = await this.wishModel.findById(
      createNotificationDto.wishReference,
    );

    if (!checkWishItem) {
      throw new BadRequestException('Unable to find wish item');
    }

    createNotificationDto.wishReference = checkWishItem._id;
    createNotificationDto.uid = new mongoose.Types.ObjectId(
      createNotificationDto.uid,
    );

    const notifications = await this.notificationModel.create(
      createNotificationDto,
    );

    if (!notifications) {
      throw new BadRequestException('Error occurred creating notifications');
    }

    return notifications;
  }

  async notifications(uid: string) {
    const notifications = await this.notificationModel.find({ uid }).lean();

    const notificationReference = await notifications.map(
      async (notification) => {
        await this.notificationModel.findByIdAndUpdate(
          { _id: notification._id },
          { status: 'read' },
        );
        return {
          ...notification,
          wishReference: await this.wishModel.findById(
            notification.wishReference,
          ),
        };
      },
    );

    return Promise.all(notificationReference);
  }
}
