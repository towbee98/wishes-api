import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { CompleteCheckout } from 'src/api/wish/dtos/CreateWishsDtos';
import { STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET } from 'src/config';
import {
  IPayment,
  StripePaymentDocument,
  StripePayments,
  StripePaymentsModel,
} from 'src/database/models/StripePayments.model';
import stripe from 'stripe';
import { MailService } from '../mail/mail.service';
import { Wishs, WishsDocument } from 'src/database/models/Wishs.model';
import { Users, UsersDocument } from 'src/database/models/Users.model';

@Injectable()
export class StripeService {
  stripeConfig;

  constructor(
    @InjectModel(StripePayments.name)
    private readonly stripePaymentModel: Model<StripePaymentDocument>,
    @InjectModel(Wishs.name)
    private readonly wishModel: Model<WishsDocument>,
    @InjectModel(Users.name)
    private readonly userModel: Model<UsersDocument>,
    private readonly mailService: MailService,
  ) {
    this.stripeConfig = new stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2023-08-16',
    });
  }

  async verifyStripeSignature(signature: string, body: any) {
    const event = this.stripeConfig.webhooks.constructEvent(
      body,
      signature,
      STRIPE_WEBHOOK_SECRET,
    );

    return event;
  }

  async startCheckout(order, amount) {
    // create draft order first

    const createSession = await this.stripeConfig.paymentIntents.create({
      amount: parseInt(amount) * 100,
      currency: 'usd',
      payment_method_types: ['card'],
      // metadata: {
      //   tax_calculation: taxCalculation.id
      // },
    });

    // create a record of the the payment intent
    const createPaymentInstance = await this.stripePaymentModel.create({
      orderId: order.id,
      paymentObject: createSession,
    });

    return {
      payment_intent_id: createSession.client_secret,
      amount: createSession.amount * 100,
      formattedAmount: amount,
      id: createPaymentInstance.id,
    };
  }

  async completeCheckout(id: string) {
    const paymentInstance = await this.stripePaymentModel.findById(id);

    if (!paymentInstance) {
      throw new BadRequestException('Unable to complete checkout.');
    }

    const paymentData = await this.stripeConfig.paymentIntents.retrieve(
      paymentInstance.paymentObject.id,
    );

    if (paymentData.status !== 'succeeded')
      throw new BadRequestException(
        'Payment failed to be completed. Kindly retry payment',
      );

    // mark order payment as paid
    await this.stripePaymentModel.findByIdAndUpdate(id, {
      status: IPayment.COMPLETED,
    });

    return this.stripePaymentModel.findById(id);
  }

  async updateTransactionFromWebhook(payment: any) {
    const updatePayment = await this.stripePaymentModel.findOneAndUpdate(
      { 'paymentObject.client_secret': payment.client_secret },
      {
        status: IPayment.COMPLETED,
      },
    );

    const stripePayment = await this.stripePaymentModel.findById(
      updatePayment.id,
    );

    // send mail to user
    const orderInformation = await this.wishModel.findById(
      stripePayment.orderId,
    );

    const orderOwner = await this.userModel.findById(orderInformation.uid);

    const data = {
      key: 'USER_NOTIFICATION',
      payloads: {
        firstName: orderOwner.firstName,
        lastName: orderOwner.lastName,
        orderInformation: stripePayment.information,
      },
      email: orderOwner.email,
    };
    this.mailService.sendMail(data);

    // admin mail
    const adminData = {
      key: 'ADMIN_NOTIFICATION',
      payload: {
        orderOwner: orderOwner,
        orderInformation: stripePayment.information,
        order: orderInformation,
      },
      email: 'admin@wishpo.com',
    };
    this.mailService.sendMail(adminData);
  }
}
