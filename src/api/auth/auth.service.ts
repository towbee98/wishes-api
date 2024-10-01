import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Users, UsersDocument } from 'src/database/models/Users.model';
import {
  AuthDto,
  AuthType,
  ResendTokenDto,
  UpdateFirstNameDto,
  VerifyTokenDto,
} from './dtos/AuthDtos';
import { UtilService } from 'src/services/util/util.service';
import {
  ITokenPurpose,
  TokenDocument,
  Tokens,
} from 'src/database/models/Tokens.model';
import { JwtService } from '@nestjs/jwt';
import { GOOGLE_CLIENT_ID, JWT_SECRET, TEST_NUMBER } from 'src/config';
import { OAuth2Client, auth } from 'google-auth-library';

const client = new OAuth2Client(GOOGLE_CLIENT_ID);

@Injectable()
export class AuthService {
  constructor(
    @InjectModel(Users.name)
    private readonly userModel: Model<UsersDocument>,
    private readonly utilService: UtilService,
    @InjectModel(Tokens.name)
    private readonly tokenModel: Model<TokenDocument>,
    private jwtService: JwtService,
  ) { }


  async user(data: AuthDto | any, query: any) {

    let userData = await this.userModel.findOne(query);

    if (!userData) {
      userData = new this.userModel();
      if (data.phoneNumber) userData.phoneNumber = data.phoneNumber;
      if (data.email) userData.phoneNumber = data.email;
      if (data.firstName) userData.firstName = data.firstName;
      if (data.lastName) userData.lastName = data.lastName;
      if (data.avatar) userData.avatar = data.avatar;
      userData.username = await this.utilService.generateUsername();
      userData.wishDescription =
        'Hey there!👋 and welcome to my Wishpo. This is a collection of items, from the practical to personal favorites, that i’ve saved from across the internet. Enjoy your visit!';
      await userData.save();
    }

    return userData;
  }

  /**
   * Authentications auth service
   * @todo implement test login for test phone number
   * @param authDto 
   * @returns authentication 
   */
  async authentication(authDto: AuthDto): Promise<any> {

    let isFullNameRequired = false;

    let queryCheck = {};


    if (authDto.type == AuthType.OTP) {

      queryCheck['phoneNumber'] = authDto.phoneNumber;

      const userData = await this.user(authDto, queryCheck);

      if (!userData?.firstName) isFullNameRequired = true;

      if (authDto.phoneNumber !== TEST_NUMBER) {
        try {
          await this.utilService.sendSms(authDto.phoneNumber);
        } catch (e) {
          throw new BadRequestException('Unable to authenticate account');
        }

      }

      return {
        ...userData.toObject(),
        isFullNameRequired,
        isOTPRequired: true,
      };

    }

    if (authDto.type == AuthType.GOOGLE) {

      try {
        const verifyToken = await client.verifyIdToken({
          idToken: authDto.googleIdToken,
          audience: GOOGLE_CLIENT_ID,
        });


        if (!verifyToken) {
          throw new BadRequestException('Google token verification failed.');
        }

        queryCheck['email'] = verifyToken.getAttributes().payload.email;

        let userData = await this.user({ ...authDto, ...verifyToken.getAttributes().payload }, queryCheck);

        return userData.toObject();
      } catch (e) {
        throw new BadRequestException('Google login failed.');
      }
    }

    throw new BadRequestException('Authentication method not supported');
  }

  /**
   * Signs token
   * @param user 
   * @returns token 
   */
  async signToken(user: Users): Promise<string> {
    return this.jwtService.signAsync(
      {
        email: user?.email,
        phoneNumber: user?.phoneNumber,
        id: user._id,
      },
      {
        algorithm: 'HS256',
        secret: JWT_SECRET,
      },
    );
  }

  /**
   * Verify token
   * @param verifyTokenDto 
   * @returns token 
   */
  async verifyToken(verifyTokenDto: VerifyTokenDto): Promise<any> {
    let isFirstNameRequired = false;

    const userData = await this.userModel.findOne({
      phoneNumber: verifyTokenDto.phoneNumber,
    });

    if (!userData)
      throw new BadRequestException('No account found for this user');


    let verifyCode: any;

    if (userData.phoneNumber === TEST_NUMBER) {

      verifyCode = {
        status: 'approved',
        valid: true
      };

    } else {

      verifyCode = await this.utilService.verifySMS(
        verifyTokenDto.code,
        verifyTokenDto.phoneNumber,
      );

    }

    // error check
    if (verifyCode?.status !== 'approved' || !verifyCode?.valid) {
      throw new BadRequestException('Unable to verify code provided');
    }

    if (!userData.isPhoneNumberVerified) {
      userData.isPhoneNumberVerified = true;
    }
    await userData.save();

    if (!userData.firstName) {
      isFirstNameRequired = true;
    }

    const data = await this.userModel.findById(userData._id);
    return {
      isFirstNameRequired,
      data,
    };
  }

  async updateFirstName(
    updateFirstNameDto: UpdateFirstNameDto,
    uid: string,
  ): Promise<any> {
    const isFirstNameRequired = false;

    const findUser = await this.userModel.findById(uid);

    if (!findUser) {
      throw new BadRequestException('user not found ');
    }

    findUser.firstName = updateFirstNameDto.firstName;
    await findUser.save();

    const data = await this.userModel.findById(findUser._id);
    return {
      isFirstNameRequired,
      data,
    };
  }

  async resendToken(resendTokenDto: ResendTokenDto) {
    try {
      await this.utilService.sendSms(resendTokenDto.phoneNumber);
    } catch (e) {
      throw new BadRequestException('Unable to authenticate account');
    }
  }
}
