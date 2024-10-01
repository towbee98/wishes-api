import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import {
  IProviderStatus,
  IProviders,
  IShopifyData,
} from 'src/types/providers.types';

//const arrayLengthValidator = (array: string[]) => array.length >= 3;

export type StoreDocument = Stores & Document;
@Schema({
  timestamps: true,
})
export class Stores {
  @Prop({ default: null })
  name: string;

  @Prop({ default: null, unique: true })
  email: string;

  @Prop({ default: null })
  category: string[];

  @Prop({ default: null, type: [{name:String,src:String}] })
  images: {name:string,src:string}[];

  @Prop({ default: null, type: String })
  description: string;

  @Prop({default:true})
  isVisible: boolean;

  @Prop({default:false})
  production: boolean;

  @Prop({default:null})
  link:string;
}

export const StoreModel = SchemaFactory.createForClass(Stores);
