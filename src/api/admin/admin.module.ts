import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { SharedModule } from 'src/shared/shared.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [SharedModule, AccountModule],
  controllers: [AdminController],
  providers: [AdminService],
  exports:[AdminService]
})
export class AdminModule {}
