import { MailerModule } from '@nestjs-modules/mailer';
import { Module } from '@nestjs/common';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { MongooseModule } from '@nestjs/mongoose';
import { TwilioModule } from 'nestjs-twilio';
import { JwtStrategy } from 'src/api/auth/jwt.strategy';
import { WishService } from 'src/api/wish/wish.service';
import { JWT_SECRET, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN } from 'src/config';
import { Admins, AdminsModel } from 'src/database/models/Admins.model';
import {
  NotificationModel,
  Notifications,
} from 'src/database/models/Notifications.model';
import { Orders, OrdersModel } from 'src/database/models/Orders.model';
import { PartnerModel, Partners } from 'src/database/models/Partners.model';
import {
  StripePayments,
  StripePaymentsModel,
} from 'src/database/models/StripePayments.model';
import { TokenModel, Tokens } from 'src/database/models/Tokens.model';
import { Users, UsersModel } from 'src/database/models/Users.model';
import { Wishs, WishsModel } from 'src/database/models/Wishs.model';
import { MailService } from 'src/services/mail/mail.service';
import { ShopifyService } from 'src/services/shopify/shopify.service';
import { StripeService } from 'src/services/stripe/stripe.service';
import { UtilService } from 'src/services/util/util.service';
import {
  WishViews,
  WishViewsModel,
} from 'src/database/models/WishsViews.model';
import { Support, SupportModel } from 'src/database/models/Supports.model';
import { StoreModel, Stores } from 'src/database/models/Store.model';
import { AccountService } from 'src/api/account/account.service';
@Module({
  imports: [
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UsersModel,
      },
      {
        name: Tokens.name,
        schema: TokenModel,
      },
      {
        name: Admins.name,
        schema: AdminsModel,
      },
      {
        name: Wishs.name,
        schema: WishsModel,
      },
      {
        name: Notifications.name,
        schema: NotificationModel,
      },
      {
        name: Partners.name,
        schema: PartnerModel,
      },
      {
        name: Stores.name,
        schema: StoreModel,
      },
      {
        name: StripePayments.name,
        schema: StripePaymentsModel,
      },
      {
        name: Orders.name,
        schema: OrdersModel,
      },
      {
        name: WishViews.name,
        schema: WishViewsModel,
      },
      {
        name: Support.name,
        schema: SupportModel,
      }
    ]),
    JwtModule.register({
      secret: JWT_SECRET,
    }),
    TwilioModule.forRoot({
      accountSid: TWILIO_ACCOUNT_SID,
      authToken: TWILIO_AUTH_TOKEN,
    }),
    MailerModule.forRoot({
      transport: {
        service: 'Mailgun',
        auth: {
          user: process.env.MAILGUN_API_KEY,
          pass: process.env.MAILGUN_DOMAIN,
        },
      },
    }),
  ],
  exports: [
    JwtModule,
    JwtService,
    JwtStrategy,
    UtilService,
    ShopifyService,
    TwilioModule,
    StripeService,
    MongooseModule.forFeature([
      {
        name: Users.name,
        schema: UsersModel,
      },
      {
        name: Tokens.name,
        schema: TokenModel,
      },
      {
        name: Admins.name,
        schema: AdminsModel,
      },
      {
        name: Wishs.name,
        schema: WishsModel,
      },
      {
        name: Notifications.name,
        schema: NotificationModel,
      },
      {
        name: Partners.name,
        schema: PartnerModel,
      },
      {
        name: StripePayments.name,
        schema: StripePaymentsModel,
      },
      {
        name: Orders.name,
        schema: OrdersModel,
      },
    ]),
    MailerModule,
    MailService,
    WishService,
  ],
  providers: [
    JwtService,
    JwtStrategy,
    UtilService,
    ShopifyService,
    StripeService,
    MailService,
    WishService,
    AccountService,
  ],
})
export class SharedModule {
  //
}
