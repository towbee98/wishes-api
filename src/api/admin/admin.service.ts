import { BadRequestException, Injectable, UseGuards } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import mongoose, { Model } from 'mongoose';
import { Admins, AdminsDocument } from 'src/database/models/Admins.model';
import {
  CreateAdminDtos,
  StoreDto,
  PasswordDto,
  UpdateAdminDtos,
  UpdatePasswordDtos,
} from './dtos/CreateAdminDtos';
import * as bcrypt from 'bcrypt';
import { AdminAuth } from '../auth/dtos/AuthDtos';
import { JwtService } from '@nestjs/jwt';
import { JWT_SECRET } from 'src/config';
import { Users, UsersDocument } from 'src/database/models/Users.model';
import {
  IWishStatus,
  Wishs,
  WishsDocument,
} from 'src/database/models/Wishs.model';
import {
  StripePayments,
  StripePaymentDocument,
} from 'src/database/models/StripePayments.model';

import { PartnerDocument, Partners } from 'src/database/models/Partners.model';
import { StoreDocument, Stores } from 'src/database/models/Store.model';
import { AccountService } from '../account/account.service';
@Injectable()
export class AdminService {
  constructor(
    @InjectModel(Admins.name)
    private readonly adminModel: Model<AdminsDocument>,
    @InjectModel(Users.name)
    private readonly usersModel: Model<UsersDocument>,
    @InjectModel(Wishs.name)
    private readonly wishModel: Model<WishsDocument>,
    @InjectModel(StripePayments.name)
    private readonly stripeModel: Model<StripePaymentDocument>,
    @InjectModel(Partners.name)
    private readonly partnerModel: Model<PartnerDocument>,
    @InjectModel(Stores.name)
    private readonly storeModel: Model<StoreDocument>,
    private jwtService: JwtService,
    private readonly accountService: AccountService,
  ) {
    //
  }

  async hashPassword(password: string) {
    const saltOrRounds = 10;
    const hash = await bcrypt.hash(password, saltOrRounds);
    return hash;
  }

  async adminAuth(authDto: AdminAuth) {
    const admin = await this.adminModel.findOne({ email: authDto.email });

    if (!admin) {
      throw new BadRequestException('Invalid credentials');
    }

    // check password
    const isMatch = await bcrypt.compare(authDto.password, admin.password);

    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }

    const token = await this.jwtService.signAsync(
      {
        email: admin.email,
        name: admin.firstName + ' ' + admin.lastName,
        id: admin._id,
        type: 'admin',
        role: admin.roles,
      },
      {
        algorithm: 'HS256',
        secret: JWT_SECRET,
      },
    );

    return {
      data: {
        user: {
          email: admin.email,
          name: admin.firstName + ' ' + admin.lastName,
          id: admin._id,
          type: 'admin',
        },
        token,
      },
    };
  }

  async createAdmins(createAdminDto: CreateAdminDtos) {
    const checkEmail = await this.adminModel.findOne({
      email: createAdminDto.email,
    });

    if (checkEmail)
      throw new BadRequestException('Email address already in use');

    const password = await this.hashPassword(createAdminDto.password);
    const data = {
      ...createAdminDto,
      password: password,
    };
    const admin = await this.adminModel.create(data);

    if (!admin) {
      throw new BadRequestException('Unable to create admin account');
    }
    admin.password = undefined;
    return admin;
  }

  async getAdmin(id: string) {
    const admin = await this.adminModel.findById(id);
    admin.password = undefined;
    return admin;
  }

  async updateAdmins(id: string, updateAdminDto: UpdateAdminDtos) {
    const userId = new mongoose.Types.ObjectId(id);
    // check username not in use
    if (updateAdminDto.email) {
      const checkUsername = await this.adminModel.findOne({
        email: updateAdminDto.email,
        _id: {
          $ne: userId,
        },
      });

      if (checkUsername)
        throw new BadRequestException(
          'Email is already in use by another user',
        );
    }

    const admin = this.adminModel.findByIdAndUpdate(id, updateAdminDto);
    if (!admin) {
      throw new BadRequestException('Unable to update admin account');
    }

    return admin;
  }

  async updatePassword(id: string, updateAdminDto: UpdatePasswordDtos) {
    // check username not in use
    const password = await this.hashPassword(updateAdminDto.password);
    const data = {
      password: password,
    };

    const admin = this.adminModel.findByIdAndUpdate(id, data);
    if (!admin) {
      throw new BadRequestException('Unable to update admin account');
    }

    return admin;
  }

  async admins() {
    const admin = await this.adminModel
      .find({ is_deleted: false })
      .select('-password');
    return admin;
  }

  async deleteAdmin(id: string) {
    const deleteUser = await this.adminModel.findByIdAndDelete(id);

    if (!deleteUser)
      throw new BadRequestException(
        'An error occurred while deleting this user',
      );
    return null;
  }

  async users(page = 1) {
    try {
      const skip = (page - 1) * 30;
      const total = await this.usersModel.count().exec();

      const users = await this.usersModel.find().skip(skip).limit(30);

      return {
        users,
        pagination: {
          total,
          page,
          pageSize: 30,
        },
      };
    } catch (error) {
      throw new Error('Error fetching users: ' + error.message);
    }
  }

  async partners(page = 1) {
    try {
      const skip = (page - 1) * 30;
      const total = await this.partnerModel.count().exec();

      const partners = await this.partnerModel.find().skip(skip).limit(30);

      return {
        partners,
        pagination: {
          total,
          page,
          pageSize: 30,
        },
      };
    } catch (error) {
      throw new BadRequestException('Error fetching users: ' + error.message);
    }
  }

  async stores(page = 1) {
    try {
      const skip = (page - 1) * 30;
      const total = await this.storeModel.count().exec();
      const stores = await this.storeModel.find().skip(skip).limit(30);

      return {
        stores,
        pagination: {
          total,
          page,
          pageSize: 30,
        },
      };
    } catch (error) {
      throw new BadRequestException('Error fetching stores: ' + error.message);
    }
  }

  async addStore(storeDto: StoreDto, files) {
    const images = [];
    const storeExists= await this.storeModel.findOne({email: storeDto.email});
    
    if(storeExists) throw new BadRequestException(`Email already exists`)

    const store = await this.storeModel.create({
      name: storeDto.name,
      email: storeDto.email,
      images: images,
      description: storeDto.description,
      category: storeDto.category.split(','),
      link:storeDto.link
    });

    await Promise.all(
      files.map(async (file,index) => {
        const uploadToS3 = await this.accountService.uploadToS3(file);
        let image={name:`${file.fieldname}`,src:`${uploadToS3.Location}`}
        store.images.push(image);
      })
    );
    
    await store.save() 
     // console.log(images);
    
    return store;
  }
  async userById(id: string) {
    const user = await this.usersModel.findById(id);

    if (!user) {
      throw new BadRequestException('No User Found');
    }

    const allWishItem = await this.wishModel.find({
      uid: user._id,
      is_deleted: false,
    });

    return {
      user,
      wishItem: allWishItem,
    };
  }

  async getStore(id: string) {
    const partner = await this.storeModel.findById(id);
    return partner;
  }
  async updateStore(id: string, storeDto: StoreDto) {
    const store = await this.storeModel.findByIdAndUpdate(id, storeDto);
    return store;
  }

  async wish() {
    const totalItems = await this.wishModel.count({ is_deleted: false }).exec();

    const page = 1; // Replace with the desired page number
    const pageSize = 30; // Replace with the desired page size (number of documents per page)

    const wish = await this.wishModel.aggregate([
      {
        $match: {
          is_deleted: false,
        },
      },
      // {
      //   $lookup: {
      //     as: 'user',
      //     from: 'users',
      //     let: { uidObj: { $toObjectId: '$uid' } },
      //     pipeline: [
      //       {
      //         $match: {
      //           $expr: { $eq: ['$_id', '$$uidObj'] },
      //         },
      //       },
      //     ],
      //   },
      // },
      // {
      //   $unwind: {
      //     path: '$user',
      //     preserveNullAndEmptyArrays: true,
      //   },
      // },
      {
        $lookup: {
          as: 'user',
          from: 'users',
          let: { uidObj: { $toObjectId: '$uid' } },
          pipeline: [
            {
              $match: {
                $expr: { $eq: ['$_id', '$$uidObj'] },
              },
            },
          ],
        },
      },
      {
        $unwind: '$user',
      },
      {
        $skip: (page - 1) * pageSize, // Calculate the number of documents to skip
      },
      {
        $limit: pageSize, // Limit the number of documents returned per page
      },
    ]);

    return {
      wish,
      pagination: {
        total: totalItems,
        page,
        pageSize: 30,
      },
    };
  }

  async wishById(id: string) {
    const wish = await this.wishModel.findById(id);

    if (!wish) {
      throw new Error('Wish item not found.');
    }

    const user = await this.usersModel.findById(wish.uid);
    const paymentObject = await this.stripeModel.findOne({ orderId: id });
    return {
      user,
      wish,
      paymentObject,
    };
  }

  async deleteWishItem(id: string) {
    const deleteWishItem = await this.wishModel.findByIdAndUpdate(
      { _id: id },
      { is_deleted: true, wish_status: IWishStatus.DELETED },
    );

    if (!deleteWishItem)
      throw new BadRequestException(
        'An error occurred while deleting this wish item',
      );
    return null;
  }

  async deleteUser(id: string) {
    const deleteUser = await this.usersModel.findByIdAndDelete(id);

    if (!deleteUser)
      throw new BadRequestException(
        'An error occurred while deleting this user',
      );
    return null;
  }

  async updateUser(id: string, user: any) {
    const userId = new mongoose.Types.ObjectId(id);
    const userRecord = await this.usersModel.findById(id);

    if (!userRecord) throw new BadRequestException('No user record found');

    if (user.username) {
      const checkUsername = await this.usersModel.findOne({
        username: user.username,
        _id: {
          $ne: userId,
        },
      });

      if (checkUsername)
        throw new BadRequestException(
          'Username is already in use by another user',
        );
    }

    if (user.username) userRecord.username = user.username;
    if (user.firstName) userRecord.firstName = user.firstName;
    if (user.lastName) userRecord.lastName = user.lastName;
    if (user.address) userRecord.address = user.address;
    if (user.wishDescription) userRecord.address = user.wishDescription;
    await userRecord.save();

    return null;
  }

  async changePassword(id: string, passwordDto: PasswordDto) {
    const admin = await this.adminModel.findById(id);
    //Check if the oldPasswrd is the same with what the user entered
    const isMatch = await bcrypt.compare(
      passwordDto.oldPassword,
      admin.password,
    );
    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }
    //Replace the old password with the new password and save.
    admin.password = await this.hashPassword(passwordDto.newPassword);

    await admin.save();
    return null;
  }
}
