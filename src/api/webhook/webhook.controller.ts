import { BadRequestException, Body, Controller, Get, HttpCode, Post, RawBodyRequest, Req, UnauthorizedException } from '@nestjs/common';
import { WebhookService } from './webhook.service';
import { ApiTags } from '@nestjs/swagger';
import { ShopifyService } from 'src/services/shopify/shopify.service';
import { Public } from 'src/decorators/auth';

@Controller('webhook')
@ApiTags('Webhook')
export class WebhookController {
  constructor(private readonly webhookService: WebhookService, private readonly shopifyService: ShopifyService) {
    //
  }

  @Post('/stripe')
  @HttpCode(200)
  async stripeWebhook(@Body() body, @Req() request) {
    const headerSecret = request.headers['stripe-signature'];
    await this.webhookService.stripeProcessCheckout(body, headerSecret);
    return { webhook: 'success' };
  }

  @Post('shopify/compliance/:target/:type')
  @HttpCode(200)
  @Public()
  async shopifyCompliance(@Body() body, @Req() request) {
   
     // await handle(req, res);
     console.log('webhook request.... compliance triggered');
 
     const verifyHmac = await this.webhookService.calculateShopifyHmac(request.rawBody , request.headers['x-shopify-hmac-sha256']);

    if (!verifyHmac) throw new UnauthorizedException('Failed verification');

    await this.webhookService.handleShopifyWebhooks(body);
    
  }

  @Post('/shopify/app/uninstall')
  @HttpCode(200)
  @Public()
  async uninstallApplication(@Body() body, @Req() request) {
    // await handle(req, res);
    console.log('webhook request.... uninstalled application triggered.');

    const verifyHmac = await this.webhookService.calculateShopifyHmac(request.rawBody , request.headers['x-shopify-hmac-sha256']);

    if (!verifyHmac) throw new UnauthorizedException('Failed verification');

    await this.webhookService.handleShopifyAppUninstalled(body);
    return { status: 'success' };
  }
}
