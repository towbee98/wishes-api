import { Module } from '@nestjs/common';
import { PartnersController } from './partners.controller';
import { PartnersService } from './partners.service';
import { SharedModule } from 'src/shared/shared.module';
import { AdminModule } from '../admin/admin.module';
import { AccountModule } from '../account/account.module';

@Module({
  imports: [SharedModule,AdminModule,AccountModule],
  controllers: [PartnersController],
  providers: [PartnersService],
})
export class PartnersModule {}
