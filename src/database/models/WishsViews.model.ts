import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IProviders } from 'src/types/providers.types';
import { Document } from 'mongoose';

export type WishViewsDocument = WishViews & Document;

@Schema({
  timestamps: true,
})
export class WishViews {
  @Prop({ required: true, unique: true })
  username: string;

  @Prop({ default: 0 })
  totalViews: number;

  @Prop({ default: 0 })
  weeklyViews: number;

  @Prop({ default: 0 })
  todayViews: number;
}

export const WishViewsModel = SchemaFactory.createForClass(WishViews);

// WishViewsModel.index({ title: 'text', description: 'text' });
