import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type UsersDocument = Users & Document;

@Schema({
  timestamps: true,
})
export class Users {
  _id: string;

  @Prop({ default: null })
  avatar: string;

  @Prop({ default: null })
  username: string;

  @Prop({ default: null })
  firstName: string;

  @Prop({ default: null })
  lastName: string;

  @Prop({ default: null })
  phoneNumber: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  address: string;

  @Prop({ default: false })
  isPhoneNumberVerified: boolean;

  @Prop({ default: null })
  wishDescription: string;

  @Prop({ default: false })
  isDeleted: boolean;

  @Prop({
    default: {
      streetAddress1: null,
      streetAddress2: null,
      city: null,
      state: null,
      postalCode: null,
      country: null,
    },
    type: Object,
  })
  shippingAddress: {
    streetAddress1: string;
    streetAddress2: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
  };

  @Prop({ default: false })
  is_account_visible: boolean;

  @Prop({
    default: {
      items_price_change: false,
      items_available: false,
      items_purchase: false,
      visibility: false,
    },
    type: Object,
  })
  notification: {
    items_price_change: false;
    items_available: false;
    items_purchase: false;
    visibility: false;
  };
  @Prop({default: false})
  check_store:boolean

  @Prop({default:null})
  last_check_store:Date
}

export const UsersModel = SchemaFactory.createForClass(Users);
