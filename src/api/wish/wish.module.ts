import { Module } from '@nestjs/common';
import { WishController } from './wish.controller';
import { WishService } from './wish.service';
import { SharedModule } from 'src/shared/shared.module';

@Module({
  imports: [SharedModule],
  controllers: [WishController],
  providers: [WishService],
})
export class WishModule {}
