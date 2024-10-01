import { BadRequestException, Injectable } from '@nestjs/common';
import { StripeService } from 'src/services/stripe/stripe.service';
import { createHmac, timingSafeEqual } from 'crypto';
import { SHOPIFY_CLIENT_CREDENTIALS, SHOPIFY_SECRET_CREDENTIALS, WEBHOOK_CLIENT_SECRET } from 'src/config';
import { ShopifyService } from 'src/services/shopify/shopify.service';
import * as crypto from 'crypto';
// import { ApiError } from 'next/dist/server/api-utils';
@Injectable()
export class WebhookService {
  client_secret;
  constructor(private readonly stripeService: StripeService, private readonly shopifyService: ShopifyService) {
    //
    this.client_secret = WEBHOOK_CLIENT_SECRET;
  }

  async stripeProcessCheckout(data: any, secret_key) {
    const event = await this.stripeService.verifyStripeSignature(
      secret_key,
      data,
    );

    // Handle the event
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log(
          `PaymentIntent for ${paymentIntent.amount} was successful!`,
        );
        break;
      case 'payment_method.attached':
        const paymentMethod = event.data.object;
        // Then define and call a method to handle the successful attachment of a PaymentMethod.
        // handlePaymentMethodAttached(paymentMethod);
        break;
      default:
        // Unexpected event type
        console.log(`Unhandled event type ${event.type}.`);
    }
  }


  async calculateShopifyHmac(query, hmac) {
    const calculatedHmac = crypto
      .createHmac('sha256', SHOPIFY_SECRET_CREDENTIALS)
      .update(query, 'hex')
      .digest('base64');
    return calculatedHmac == hmac;
  }

  async handleShopifyWebhooks(data: any) {

    // keep log of webhook call 
    switch (data.type) {
      case 'shop/redact':
        // this.shopifyService.shopRedact(data.payload);
        break;
    }

    return {}
  }

  async handleShopifyAppUninstalled(data: any) {
    try {

    const shopRedact = await   this.shopifyService.shopRedact(data);

    console.log(shopRedact);

    } catch (e) {

      //  log error 
      console.log(e);

      // throw new BadRequestException('Request action failed. ');
      
;    }
  }
}
