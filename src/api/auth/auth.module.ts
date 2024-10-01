import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { UtilService } from 'src/services/util/util.service';
import { TwilioModule } from 'nestjs-twilio';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [AuthController],
  providers: [AuthService, UtilService],
})
export class AuthModule {}
