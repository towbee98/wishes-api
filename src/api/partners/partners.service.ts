import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Partners, PartnerDocument } from 'src/database/models/Partners.model';
import { Model } from 'mongoose';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { CreatePartnerDto } from './dtos/CreatePartnersDto';
import { JWT_SECRET } from 'src/config';
import { SignInPartnerDto } from './dtos/SignInPartnersDto';


@Injectable()
export class PartnersService {
  constructor(
    @InjectModel(Partners.name)
    private readonly partnerModel: Model<PartnerDocument>,
    private jwtService: JwtService,
  ) {}
  async signUp(signUpDto: CreatePartnerDto) {
    const hashedPassword = await bcrypt.hash(signUpDto.password, 10);
    const data = {
      ...signUpDto,
      password: hashedPassword,
    };
    const partner = await this.partnerModel.create(data);
    if (!partner) {
      throw new BadRequestException('Unable to create a partner');
    }
    return partner;
  }
  async signIn(signInDto: SignInPartnerDto) {
    const { domain, password } = signInDto;

    const partner = await this.partnerModel.findOne({
      providerData: { shop_domain: domain },
    });

    if (!partner) {
      throw new BadRequestException('Invalid credentials');
    }
    if (partner?.password !== password) {
      throw new UnauthorizedException('Wrong password');
    }
    const isMatch = await bcrypt.compare(signInDto.password, partner.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }
    const user = {
      email: partner.email,
      name: partner.name,
      domain: partner.providerData.shop_domain,
      type: 'partner',
    };
    const token = await this.jwtService.signAsync(user, {
      algorithm: 'HS256',
      secret: JWT_SECRET,
    });
    return {
      data: {
        user,
        token,
      },
    };
  }

  
}
