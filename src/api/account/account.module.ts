import { Module } from '@nestjs/common';
import { AccountController } from './account.controller';
import { AccountService } from './account.service';
import { SharedModule } from 'src/shared/shared.module';
import { AdminModule } from '../admin/admin.module';

@Module({
  imports: [SharedModule],
  controllers: [AccountController],
  providers: [AccountService],
  exports: [AccountService],
})
export class AccountModule {}
