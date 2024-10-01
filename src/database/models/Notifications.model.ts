import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type NotificationDocument = Notifications & Document;

@Schema({
  timestamps: true,
})
export class Notifications {
  _id: string;

  @Prop({ default: null })
  uid: string;

  @Prop({ default: null })
  wishReference: string;

  @Prop({ default: null })
  title: string;

  @Prop({ default: null })
  body: string;

  @Prop({ default: 'not-read' })
  status: 'read' | 'not-read';
}

export const NotificationModel = SchemaFactory.createForClass(Notifications);
