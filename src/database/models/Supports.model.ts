import { Prop, SchemaFactory, Schema } from '@nestjs/mongoose';
import { Document } from 'mongoose';

export type SupportDocument = Support & Document;

export enum IStatus {
  COMPLETED = 'completed',
  PENDING = 'pending',
}

@Schema({
  timestamps: true,
})
export class Support {
  @Prop({ default: null })
  partnerId: string;

  @Prop({ required: true })
  subject: string;

  @Prop({ default: null })
  description: string;

  @Prop({ default: IStatus.PENDING, type: String,  })
  status: any
}

export const SupportModel = SchemaFactory.createForClass(Support);
