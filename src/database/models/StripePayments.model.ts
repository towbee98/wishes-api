import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';

export type StripePaymentDocument = StripePayments & Document;

export enum IPayment {
  PENDING = 'PENDING',
  INITIATED = 'INITIATED',
  COMPLETED = 'COMPLETED',
}

@Schema({
  timestamps: true,
})
export class StripePayments {
  @Prop({ default: null })
  orderId: string;

  @Prop({ default: null, type: Object })
  paymentObject: any;

  @Prop({ default: IPayment.PENDING })
  status: IPayment;

  @Prop({ default: null, type: Object })
  information: {
    is_anonymous: boolean;
    last_name: string;
    first_name: string;
    email: string;
    personalized_message: string;
  };
}

export const StripePaymentsModel = SchemaFactory.createForClass(StripePayments);
