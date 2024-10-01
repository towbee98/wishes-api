import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { IProviderStatus, IProviders, IShopifyData } from 'src/types/providers.types';

//const arrayLengthValidator = (array: string[]) => array.length >= 3;

export type PartnerDocument = Partners & Document;
@Schema({
  timestamps: true,
})
export class Partners {
  
  @Prop({ default: null })
  name: string;

  @Prop({ default: null })
  email: string;

  @Prop({ default: null })
  password: string;

  @Prop({ required: true, enum: IProviders})
  provider: IProviders

  @Prop({ default: null , type: Object})
  providerData: IShopifyData | null

  @Prop({ default: null, type: [String] })
  images: string[];

  @Prop({ default: null, type: String })
  description: string;
  
  @Prop({ default: null })
  storeCurrency: string;

  @Prop({ required: true, enum: IProviderStatus, default: IProviderStatus.INPROGRESS})
  status: IProviderStatus

  @Prop({ default: null, type: Object })
  settings: any
  
  @Prop({ default: null, type: Object })
  session: any
}

export const PartnerModel = SchemaFactory.createForClass(Partners);
