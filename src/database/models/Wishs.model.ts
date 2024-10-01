import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IProviders } from 'src/types/providers.types';
import { Document } from 'mongoose';

export type WishsDocument = Wishs & Document;

export enum IWishStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  CLOSED_BY_VENDOR = 'CLOSED_BY_VENDOR',
  CANCELED = 'CANCELED',
  HIDDEN = 'HIDDEN',
  DELETED = 'DELETED',
  PAID = 'PAID',
}
@Schema({
  timestamps: true,
})
export class Wishs {
  @Prop({ required: true })
  uid: string;

  @Prop({ required: true })
  title: string;

  @Prop({ required: true, enum: IProviders })
  provider: string;

  @Prop({ required: true })
  vendor: string;

  @Prop({ required: true })
  item_id: string;

  @Prop({ default: null })
  productVariant: string;

  @Prop({ required: true })
  status: boolean;

  @Prop({ required: true })
  image: string;

  @Prop({ required: true })
  amount: number;

  @Prop({ required: true })
  formattedAmount: number;

  @Prop({ default: null })
  description: string;

  @Prop({ required: true, enum: IWishStatus, default: IWishStatus.PENDING })
  wish_status: IWishStatus;

  @Prop({ required: true, enum: IWishStatus, default: IWishStatus.PENDING })
  payment_status: IWishStatus;

  @Prop({ default: false })
  is_deleted: boolean;

  @Prop({ default: false })
  is_priority: boolean;

  @Prop({ default: null, type: Object })
  orderData: any;

  @Prop({ default: null, type: Object })
  storeInformation: any;

  @Prop({ default: null, type: Object })
  checkout: any;

  @Prop({ default: null, type: Object })
  store: any;

  @Prop({ default: null, type: String })
  bgColor: string;

  @Prop({ default: null, type: String })
  sort: string;

  @Prop({ default: null, type: String })
  service_fee: string;

  @Prop({ default: null, type: String })
  shipping_fee: string;

  @Prop({ default: null, type: String })
  tax: string;

  @Prop({
    default: {
      is_anonymous: null,
      last_name: null,
      first_name: null,
      personalized_message: null,
      email: null,
    },
    type: Object,
  })
  paidByInformation: {
    is_announcement: string;
    last_name: string;
    first_name: string;
    personalized_message: string;
    email: string;
  };
}

export const WishsModel = SchemaFactory.createForClass(Wishs);

WishsModel.index({ title: 'text', description: 'text' });
