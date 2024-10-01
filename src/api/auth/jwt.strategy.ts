import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { PassportStrategy } from '@nestjs/passport';
import { Model } from 'mongoose';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { JWT_SECRET } from 'src/config';
import { Admins, AdminsDocument } from 'src/database/models/Admins.model';
import { Users, UsersDocument } from 'src/database/models/Users.model';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectModel(Users.name)
    private readonly userModel: Model<UsersDocument>,
    @InjectModel(Admins.name)
    private readonly adminModel: Model<AdminsDocument>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: JWT_SECRET,
    });
  }

  async validate(payload: any) {
    const { id } = payload;
    if (payload.type === 'admin') {
      const admin = await this.adminModel.findById(id).select('-password');
      if (!admin) {
        throw new UnauthorizedException();
      }
      return admin;
    }
    const user = await this.userModel.findById(id).select('-password');
    if (!user) {
      throw new UnauthorizedException();
    }
    return user;
  }
}
