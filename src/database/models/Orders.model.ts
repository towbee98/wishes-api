import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type OrdersDocument = Orders & Document;
@Schema({
  timestamps: true,
})
export class Orders {
  @Prop({ default: null })
  userId: string;

  @Prop({ default: null })
  wishId: string;

  @Prop({ default: null, type: Object })
  orderInformation: any;
}

export const OrdersModel = SchemaFactory.createForClass(Orders);
