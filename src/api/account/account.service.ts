import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Users, UsersDocument } from 'src/database/models/Users.model';
import {
  SettingsUpdateDto,
  UpdateAccountDto,
  UpdateShippingDto,
} from './UpdateAccountDto';
import {
  NotificationDocument,
  Notifications,
} from 'src/database/models/Notifications.model';
import * as AWS from 'aws-sdk';
import { AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY } from 'src/config';
import { Stores, StoreDocument } from 'src/database/models/Store.model';

@Injectable()
export class AccountService {
  AWS_S3_BUCKET = 'wishpo';
  s3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACCESS_KEY,
  });

  constructor(
    @InjectModel(Users.name)
    private readonly userModel: Model<UsersDocument>,
    @InjectModel(Notifications.name)
    private readonly notificationModel: Model<NotificationDocument>,
    @InjectModel(Stores.name)
    private readonly storeModel: Model<StoreDocument>,
  ) {
    //
  }

  async updateUserProfile(
    updateAccountDto: UpdateAccountDto,
    uid: string,
  ): Promise<any> {
    const userId = new mongoose.Types.ObjectId(uid);
    // check username not in use
    if (updateAccountDto.username) {
      const checkUsername = await this.userModel.findOne({
        username: updateAccountDto.username,
        _id: {
          $ne: userId,
        },
      });

      if (checkUsername)
        throw new BadRequestException(
          'Username is already in use by another user',
        );
    }
    const user = await this.userModel.findByIdAndUpdate(
      { _id: uid },
      updateAccountDto,
    );

    if (!user) throw new BadRequestException('Unable to update your profile');

    return this.profile(uid);
  }

  async updateShippingInformation(
    updateShippingDto: UpdateShippingDto,
    uid: string,
  ): Promise<any> {
    const userData = await this.userModel.findById(uid);

    const userProfile = {
      firstName: updateShippingDto.firstName,
      lastName: updateShippingDto.lastName,
    };

    delete updateShippingDto.firstName;
    delete updateShippingDto.lastName;

    const user = await this.userModel.findByIdAndUpdate(uid, {
      shippingAddress: { ...userData.shippingAddress, ...updateShippingDto },
      firstName: userProfile.firstName || userData.firstName,
      lastName: userProfile.lastName || userData.lastName,
    });

    if (!user)
      throw new BadRequestException('Unable to update shipping information');

    return this.profile(uid);
  }

  async updateSettings(
    updateShippingDto: SettingsUpdateDto,
    uid: string,
  ): Promise<any> {
    const userId = new mongoose.Types.ObjectId(uid);
    if (updateShippingDto.username) {
      const checkUsername = await this.userModel.findOne({
        username: updateShippingDto.username,
        _id: {
          $ne: userId,
        },
      });

      if (checkUsername)
        throw new BadRequestException(
          'Username is already in use by another user',
        );
    }

    const userData = await this.userModel.findById(uid);

    const user = await this.userModel.findByIdAndUpdate(uid, {
      shippingAddress: {
        ...userData.shippingAddress,
        ...updateShippingDto.address,
      },
      username: updateShippingDto.username,
      is_account_visible: updateShippingDto.notifications.visibility,
      notification: {
        ...userData.notification,
        ...updateShippingDto.notifications,
      },
    });

    if (!user)
      throw new BadRequestException('Unable to update shipping information');

    return this.profile(uid);
  }

  async checkUsername(name: string, uid: string) {
    const userId = new mongoose.Types.ObjectId(uid);

    let usernameCheck;

    if (uid) {
      usernameCheck = await this.userModel.findOne({
        _id: {
          $ne: userId,
        },
        username: name,
      });
    } else {
      usernameCheck = await this.userModel.findOne({
        username: name,
      });
    }

    if (usernameCheck) {
      isAvailable: false;
    }

    return {
      isAvailable: true,
    };
  }

  async profile(uid: string) {
    const user = await this.userModel.findById(uid);
    if (!user) throw new BadRequestException('Unable to find user profile');
    const notificationCount = await this.notificationModel.count({
      uid,
      status: 'not-read',
    });
    return { user, notificationCount };
  }

  async deleteUserAccount(uid: string) {
    const deleteUserAccount = await this.userModel.findByIdAndDelete(uid);

    if (!deleteUserAccount)
      throw new BadRequestException(
        'An error occurred while deleting user account',
      );

    // delete all order made by user delete all wish data

    return {
      message: 'Account deleted successfully',
    };
  }

  async stores(page = 1, filter?: any) {
    try {
      const size= 60
      const skip = (page - 1) * size;
      const total = await this.storeModel.count().exec();

      const stores = filter
        ? await this.storeModel
            .find({ category: { $in: filter } })
            .skip(skip)
            .limit(size)
        : await this.storeModel.find().skip(skip).limit(size);

      return {
        stores,
        pagination: {
          total,
          page,
          pageSize: size,
        },
      };
    } catch (error) {
      throw new BadRequestException('Error fetching stores: ' + error.message);
    }
  }

  async getStore(id: string) {
    const store = await this.storeModel.findById(id);
    if (!store) throw new BadRequestException('Store not found');
    return store;
  }

  async checklastStoreFetch(authId: string) {
    const user = await this.userModel.findById(authId);
    if (!user.check_store) {
      user.check_store = true;
      user.last_check_store = new Date();
      await user.save();
      return false;
    } else if (user.check_store) {
      const currentDate = new Date();
      const timeDifference =
        (currentDate.getTime() - user.last_check_store.getTime()) / (1000 * 60);
      if (timeDifference > 60) {
        user.last_check_store = new Date();
        await user.save();
        return true;
      }
      return false;
    }
  }
  async uploadAvatar(file, uid: string) {
    const uploadToS3 = await this.uploadToS3(file);
    await this.userModel.findByIdAndUpdate(uid, {
      avatar: uploadToS3.Location,
    });
    return this.profile(uid);
  }

  async uploadToS3(file) {
    const { originalname } = file;
    const params = {
      Bucket: this.AWS_S3_BUCKET,
      Key: String(originalname),
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
      ContentDisposition: 'inline',
      CreateBucketConfiguration: {
        LocationConstraint: 'us-east-2',
      },
    };

    try {
      const s3Response = await this.s3.upload(params).promise();
      return s3Response;
    } catch (e) {
      throw new BadRequestException(
        'Unable to upload profile picture. please try again',
      );
    }
  }
}
