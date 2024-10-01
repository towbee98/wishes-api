import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { MONGO_DB_URL } from 'src/config';

@Module({
  imports: [MongooseModule.forRoot(MONGO_DB_URL)],
  controllers: [],
  providers: [],
})
export class DatabaseModule {}
