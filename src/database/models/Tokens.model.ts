import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type TokenDocument = Tokens & Document;

export enum ITokenPurpose {
  RESET_PASSWORD = 'reset_password',
  EMAIL_CONFIRMATION = 'email_confirmation',
  CODE_VERIFICATION = 'code_verification',
}

@Schema({
  timestamps: true,
})
export class Tokens {
  @Prop({ default: null })
  userId: string;

  @Prop({ required: true })
  token: string;

  @Prop({ default: null })
  expiresAt: Date;

  @Prop({ default: 'code_verification' })
  purpose: ITokenPurpose;

  @Prop({ default: null })
  email: string;
}

export const TokenModel = SchemaFactory.createForClass(Tokens);
