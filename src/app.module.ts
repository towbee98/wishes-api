import { Module } from '@nestjs/common';
import { AuthModule } from './api/auth/auth.module';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from './api/auth/jwt.auth.guard';
import { DatabaseModule } from './database/database.module';
import { WishModule } from './api/wish/wish.module';
import { PartnersModule } from './api/partners/partners.module';
import { AdminModule } from './api/admin/admin.module';
import { SharedModule } from './shared/shared.module';
import { AccountModule } from './api/account/account.module';
import { NotificationsModule } from './api/notifications/notifications.module';
import { ShopifyService } from './services/shopify/shopify.service';
import { HealthModule } from './health/health.module';
import { StripeService } from './services/stripe/stripe.service';
import { WebhookModule } from './api/webhook/webhook.module';
import { MailService } from './services/mail/mail.service';

@Module({
  imports: [
    AuthModule,
    DatabaseModule,
    WishModule,
    PartnersModule,
    AdminModule,
    SharedModule,
    AccountModule,
    NotificationsModule,
    HealthModule,
    WebhookModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    ShopifyService,
    StripeService,
    MailService,
  ],
})
export class AppModule {}
