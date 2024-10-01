import { BadRequestException, Injectable, UnauthorizedException } from '@nestjs/common';
import '@shopify/shopify-api/adapters/node';
import { LATEST_API_VERSION, shopifyApi } from '@shopify/shopify-api';
import {
  IProviderStatus,
  IProviders,
  ShopifyAuthRedirect,
  ShopifyScopes,
  ShopifyUninstallAppEndpoint,
} from 'src/types/providers.types';
import fetch from 'node-fetch';
import { atob } from 'buffer';
import * as crypto from 'crypto';
import {
  SHOPIFY_CLIENT_CREDENTIALS,
  SHOPIFY_SECRET_CREDENTIALS,
} from 'src/config';
import { InjectModel } from '@nestjs/mongoose';
import { PartnerDocument, Partners } from 'src/database/models/Partners.model';
import { Model } from 'mongoose';
import { Wishs, WishsDocument } from 'src/database/models/Wishs.model';
import { Orders, OrdersDocument } from 'src/database/models/Orders.model';
import { UtilService } from '../util/util.service';
import { Support, SupportDocument } from 'src/database/models/Supports.model';
import { SupportDto } from 'src/api/wish/dtos/CreateWishsDtos';

@Injectable()
export class ShopifyService {
  latest_API_VERSION = LATEST_API_VERSION;

  constructor(
    @InjectModel(Partners.name)
    private readonly partnerModel: Model<PartnerDocument>,
    @InjectModel(Wishs.name)
    private readonly wishModel: Model<WishsDocument>,
    @InjectModel(Orders.name)
    private readonly orderModel: Model<OrdersDocument>,
    @InjectModel(Support.name)
    private readonly supportModel: Model<SupportDocument>,
    private utilService: UtilService,
  ) {
    //
  }

  async fetchRequest(url: string, requestObject: any) {
    return fetch(url, requestObject);
  }

  /**
   * Calculates hmac to verify request
   * @param query
   * @returns
   */
  async calculateHmacToVerifyRequest(query) {
    const hmac = query.hmac;

    // delete hmac from the query object after assigning
    delete query.hmac;

    const queryParams = [];

    // loop through the query this is for the purpose of verifying the source of the request
    for (const key in query) {
      if (query.hasOwnProperty(key)) {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(query[key]);
        queryParams.push(`${encodedKey}=${encodedValue}`);
      }
    }

    const newString = queryParams.join('&');

    console.log(newString);

    const computedHMAC = await crypto
      .createHmac('sha256', SHOPIFY_SECRET_CREDENTIALS)
      .update(newString)
      .digest('hex');

    if (computedHMAC !== hmac) {
      return false;
    }

    return true;
  }

  /**
   * Inits store
   * @param query
   * @returns
   * @todo when hmac fails find a better approach to discard code
   */
  async initStore(query: any) {
    const calculateHMAC = this.calculateHmacToVerifyRequest(query);

    if (!calculateHMAC) return;

    // check if this store already has an ongoing installation to see if the installation is active
    let checkStore = await this.partnerModel.findOne({
      'providerData.shop_domain': query.shop,
      status: { $in: [IProviderStatus.ACTIVE, IProviderStatus.INPROGRESS] },
    });

    // check if query param embedded is passed and also check if token passed is valid
    if (query.hasOwnProperty('embedded') && query['embedded'] == 1) {
      // verify token
      checkStore.session = query;
      await checkStore.save();

      // const orderItem = await this.
      const start_date =  query.start_date;
      const end_date = query.end_date;

      const wish = await this.wishModel.aggregate([
        {
          $match: {
            created_at: {
              $lt: end_date,
              $gt: start_date
            },
            'store.domain': query.shop
          }
        },
        {
          $lookup : {
            from: 'users',
            foreignField: 'id',
            localField: 'uid',
            as: 'user'
          }
        },
        {
          $unwind: '$user'
        }
      ]);

      return {
        wish,
        redirectURI: null
      };
    }

    if (!checkStore) {
      const generateOunce = new Date();
      const nonce = generateOunce.getTime();

      // if this is empty create a new instance
      checkStore = await this.partnerModel.create({
        provider: IProviders.SHOPIFY,
        providerData: {
          shop_domain: query.shop,
          nonce,
        },
      });
    }

    // generate the redirect object
    const redirectObject = {
      client_id: SHOPIFY_CLIENT_CREDENTIALS,
      redirect_uri: ShopifyAuthRedirect,
      state: checkStore.providerData?.nonce,
      scope: ShopifyScopes.join(','),
    };

    // convert redirect object to query param
    const redirectParam = [];

    for (const key in redirectObject) {
      if (redirectObject.hasOwnProperty(key)) {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(redirectObject[key]);
        redirectParam.push(`${encodedKey}=${encodedValue}`);
      }
    }

    const redirectURIString = redirectParam.join('&');

    const redirectURI = `https://${query.shop}/admin/oauth/authorize?${redirectURIString}`;

    return {
      totalProduct: 0,
      totalCompletedOrder: 0,
      totalSales: 0,
      redirectURI: redirectURI,
    };
  }

  /**
   * Completes installation
   * @param query
   * @returns
   * @todo Modify the try and catch to actually throw error when it fails
   */
  async completeInstallation(query: any) {
    const calculateHMAC = this.calculateHmacToVerifyRequest(query);

    if (!calculateHMAC) return;

    const fetchAuthState = await this.partnerModel.findOne({
      'providerData.nonce': parseInt(query.state),
      status: IProviderStatus.INPROGRESS,
    });

    if (!fetchAuthState) throw new BadRequestException('Invalid auth state.');

    // verifying the request , proceed to request access token
    const url = `https://${fetchAuthState.providerData?.shop_domain}/admin/oauth/access_token`;

    const data = JSON.stringify({
      code: query.code,
      client_id: SHOPIFY_CLIENT_CREDENTIALS,
      client_secret: SHOPIFY_SECRET_CREDENTIALS,
    });

    const requestOption = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    };

    try {
      // if the token fetch is successful
      const request = await fetch(url, requestOption);

      const responseData = await request.json();

      await this.partnerModel.findOneAndUpdate(
        {
          'providerData.nonce': fetchAuthState.providerData?.nonce,
        },
        {
          'providerData.accessToken': {
            accessToken: responseData.access_token,
            scope: ShopifyScopes.join(','),
          },
        },
      );

      await this.saveShopInformation(
        responseData.access_token,
        fetchAuthState.providerData?.nonce,
        fetchAuthState.providerData?.shop_domain,
      );

      await this.registerAppUninstallWebhook(
        responseData.access_token,
        fetchAuthState.providerData?.nonce,
        fetchAuthState.providerData?.shop_domain,
      );
    } catch (e) {
      //
      console.log(e);
    }
    return { url: `https://${atob(query.host)}/apps/wishpo-dev-app` };
  }

  async saveShopInformation(
    access_token: string,
    state: string,
    shopUrl: string,
  ) {
    // collect store information
    const storeRequestObject = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': access_token,
      },
    };
    const userUrl = `https://${shopUrl}/admin/api/${LATEST_API_VERSION}/shop.json`;
    const requestFetch = await this.fetchRequest(userUrl, storeRequestObject);
    const responseFetch = await requestFetch.json();

    // console.log(responseFetch);
    const data = await this.partnerModel.findOneAndUpdate(
      {
        'providerData.nonce': state,
      },
      {
        'providerData.shopProviderInformation': responseFetch.shop,
        name: responseFetch.shop.shop_owner,
        email: responseFetch.shop.email,
        status: IProviderStatus.ACTIVE,
      },
    );
  }

  async settings(payload: any) {

    let store = await this.partnerModel.findOne({ 'session.id_token': payload['session_id_token'] });

    if (!store) throw new UnauthorizedException();

    store.settings = {
      color: payload['color'],
      size: payload['size'],
    }

    store.save();

    return ;
  }

  async submitTicket (payload: SupportDto) {
    let store = await this.partnerModel.findOne({ 'session.id_token': payload['session_id_token'] });

    if (!store) throw new UnauthorizedException();

    const ticket = new this.supportModel();
    ticket.subject = payload['subject'];
    ticket.description = payload['description'];
    ticket.partnerId = store.id;
    await ticket.save();

    return ;
  }

  async registerAppUninstallWebhook(
    access_token: string,
    state: string,
    shopUrl: string,
  ) {
    const userUrl = `https://${shopUrl}/admin/api/${LATEST_API_VERSION}/webhooks.json`;

    const data = {
      webhook: {
        address: ShopifyUninstallAppEndpoint,
        topic: 'app/uninstalled',
        format: 'json',
      },
    };

    const storeRequestObject = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': access_token,
      },
      body: JSON.stringify(data),
    };

    const requestFetch = await this.fetchRequest(userUrl, storeRequestObject);
    const responseFetch = await requestFetch.json();

    console.log(responseFetch);
  }

  async shopRedact(payload) {
    const shopData = await this.partnerModel.findOne({ 'providerData.shop_domain': payload.domain, status: IProviderStatus.ACTIVE });
    console.log(shopData);
    if (!shopData) return { status: 'failed', message: 'No record found' };

    shopData.status = IProviderStatus.DELETED;
    await shopData.save();
  }

  /**
   * @Deprecated
   * Inits provider register ()
   * @param body
   * @returns
   */
  async initProviderRegister(body: any) {
    const hmac = body.hmac;
    delete body.hmac;

    const queryParams = [];

    for (const key in body) {
      if (body.hasOwnProperty(key)) {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(body[key]);
        queryParams.push(`${encodedKey}=${encodedValue}`);
      }
    }

    const newString = queryParams.join('&');

    const computedHMAC = await crypto
      .createHmac('sha256', SHOPIFY_SECRET_CREDENTIALS)
      .update(newString)
      .digest('hex');

    if (computedHMAC !== hmac) {
      console.log('not matched');
      return;
    }

    const generateOunce = new Date();
    const nonce = generateOunce.getTime();

    await this.partnerModel.create({
      provider_tokens: nonce,
      provider: IProviders.SHOPIFY,
      shop: body.shop,
    });

    const redirectObject = {
      client_id: SHOPIFY_CLIENT_CREDENTIALS,
      redirect_uri: 'https://api.wishpo.com/wish/shopify/authenticate-provider',
      state: nonce,
      scope:
        'write_draft_orders,write_products,read_shipping,write_orders,read_orders,read_assigned_fulfillment_orders,write_assigned_fulfillment_orders,read_cart_transforms,write_cart_transforms,read_checkouts,write_checkouts,write_fulfillments,read_fulfillments,read_inventory,write_inventory',
    };

    const redirectParam = [];

    for (const key in redirectObject) {
      if (redirectObject.hasOwnProperty(key)) {
        const encodedKey = encodeURIComponent(key);
        const encodedValue = encodeURIComponent(redirectObject[key]);
        redirectParam.push(`${encodedKey}=${encodedValue}`);
      }
    }

    console.log(redirectObject);
    const redirectUriString = redirectParam.join('&');

    const redirectUri = `https://${body.shop}/admin/oauth/authorize?${redirectUriString}`;

    return { url: redirectUri };
  }

  /**
   * @Deprecated
   * Authenticates provider (Deprecated)
   * @param body
   * @returns
   */
  async authenticateProvider(body: any) {
    const fetchAuthState = await this.partnerModel.findOne({
      provider_tokens: body.state,
    });

    if (!fetchAuthState) throw new BadRequestException('Invalid auth state.');

    // fetch to call to get access token
    const url = `https://${body.shop}/admin/oauth/access_token`;

    const data = JSON.stringify({
      code: body.code,
      client_id: SHOPIFY_CLIENT_CREDENTIALS,
      client_secret: SHOPIFY_SECRET_CREDENTIALS,
    });

    const requestOption = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data,
    };

    try {
      const request = await fetch(url, requestOption);

      const responseData = await request.json();
      await this.partnerModel.findOneAndUpdate(
        {
          provider_tokens: body.state,
        },
        { providerData: responseData },
      );

      await this.saveShopInformation(
        responseData.access_token,
        body.state,
        body.shop,
      );
    } catch (e) {
      //
    }
    return { url: `https://${atob(body.host)}/apps/wishpo-dev-app` };
  }

  async checkout(order: WishsDocument, userInformation: any) {
    const storeInformation = order.store;
    const partnerData = await this.partnerModel.findOne({
      'providerData.shop_domain': storeInformation?.domain,
    });
    // console.log('Line 176 :' + partnerData);
    const accessToken = partnerData.providerData.accessToken.accessToken;

    const createOrder = await this.createDraftOrder(
      order,
      accessToken,
      userInformation,
      partnerData,
    );

    return createOrder;
  }

  async createDraftOrder(
    order: WishsDocument,
    token: string,
    userInformation: any,
    partnerData: PartnerDocument,
  ) {
    // console.log("We are getting there")
    const orderDataVariants = order.orderData.variants[0];
    console.log(orderDataVariants);
    const payload = {
      draft_order: {
        line_items: [
          {
            variant_id: orderDataVariants.id,
            quantity: 1,
          },
        ],
        shipping_address: {
          first_name: userInformation.firstName,
          last_name: userInformation.lastName,
          address1: userInformation.shippingAddress.streetAddress1,
          city: userInformation.shippingAddress.city,
          province: userInformation.shippingAddress.state,
          country: userInformation.shippingAddress.country,
          zip: userInformation.shippingAddress.postalCode,
          phone: userInformation.phoneNumber,
        },
        billing_address: {
          first_name: userInformation.firstName,
          last_name: userInformation.lastName,
          address1: userInformation.shippingAddress.streetAddress1,
          city: userInformation.shippingAddress.city,
          province: userInformation.shippingAddress.state,
          country: userInformation.shippingAddress.country,
          zip: userInformation.shippingAddress.postalCode,
          phone: userInformation.phoneNumber,
        },
      },
    };
    const draftOrderObject = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
      body: JSON.stringify(payload),
    };
    // console.log(token)
    // console.log(payload)
    try {
      const url = `https://${partnerData.providerData.shop_domain}/admin/api/${LATEST_API_VERSION}/draft_orders.json`;
      const request = await this.fetchRequest(url, draftOrderObject);
      console.log(request.status);
      console.log(await request.json());
      if (![200, 201, 202].includes(request.status))
        throw new BadRequestException(
          'Unable to process request for checkout. Kindly try again',
        );

      const responseData = await request.json();

      // Access a specific header value
      // const retryAfter = request.headers.get('retry-after');
      // const location = request.headers.get('location');

      // const handleRecursiveCall = await this.handleRecursiveDraftActionCall(
      //   location,
      //   token,
      // );

      const taxFee = responseData.draft_order.total_tax;
      const shippingFee = 0;

      const serviceFee = await this.utilService.calculateOnePercentFee(
        responseData.draft_order.total_price,
      );

      await this.wishModel.findByIdAndUpdate(order.id, {
        checkout: responseData.draft_order,
        service_fee: serviceFee,
        shipping_fee: shippingFee,
        tax: taxFee,
      });

      const orderUpdated = await this.wishModel.findById(order.id).lean();

      return {
        orderItem: orderUpdated,
        amount: responseData.draft_order.total_price,
        tax: taxFee,
        service_fee: serviceFee,
        shipping_fee: shippingFee,
        total:
          parseFloat(responseData.draft_order.total_price) +
          parseFloat(serviceFee),
      };
    } catch (err) {
      console.log(err);
      throw new BadRequestException(err.message);
    }
  }

  async createOrder(order: WishsDocument, userInformation: any) {
    const store = await this.partnerModel.findOne({
      'storeInformation.shop.email': order.store.email,
    });

    const orderInformation = order.orderData;

    const singleLineItem = {
      id: orderInformation.id,
      title: orderInformation.title,
      price: orderInformation.price / 100,
      quantity: 1,
      tax_lines: [],
    };

    if (order.productVariant) {
      singleLineItem['variant_id'] = order.productVariant;
    }

    // refresh store information

    const lineItem = {
      order: {
        line_items: [singleLineItem],
        customer: {
          first_name: userInformation.firstName,
          last_name: userInformation.lastName,
          email: userInformation.email,
        },
        shipping_address: {
          first_name: userInformation.firstName,
          last_name: userInformation.lastName,
          address1: userInformation.shippingAddress.streetAddress1,
          phone: userInformation.phoneNumber,
          city: userInformation.shippingAddress.city,
          province: userInformation.shippingAddress.state,
          country: userInformation.shippingAddress.country,
          zip: userInformation.shippingAddress.postalCode,
        },
        fulfillment_status: null,
        transactions: [
          {
            kind: 'sale',
            status: 'success',
            amount: orderInformation.price / 100,
          },
        ],
        currency: 'USD',
      },
    };

    const storeRequestObject = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': 'shpua_4b754854863fc4bf33b0f4ad90017a99',
      },
      body: JSON.stringify(lineItem),
    };

    const userUrl = `https://${store.providerData.shop_domain}/admin/api/${LATEST_API_VERSION}/orders.json`;
    const requestFetch = await this.fetchRequest(userUrl, storeRequestObject);

    if (!requestFetch.ok) {
      throw new BadRequestException('Unable to create order. Please try again');
    }

    const responseFetch = await requestFetch.json();

    // // save order information
    // await this.orderModel.create({
    //   userId: userInformation.id,
    //   wishId: order.id,
    //   orderInformation: responseFetch,
    // });
    return responseFetch;
  }

  async completeOrder(order: WishsDocument) {
    await this.markDraftOrderAsPaid(order);
  }

  async markDraftOrderAsPaid(order: WishsDocument) {
    const storeInformation = order.storeInformation;

    const partnerData = await this.partnerModel.findOne({
      'storeInformation.store.email': storeInformation?.email,
      'storeInformation.store.domain': storeInformation?.domain,
    });

    const accessToken = partnerData.providerData?.accessToken.accessToken;

    const payload = {
      draft_order_id: order.checkout.id,
    };

    const draftOrderObject = {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify(payload),
    };

    try {
      const url = `https://${partnerData.providerData.shop_domain}/admin/api/${LATEST_API_VERSION}/draft_orders/${order.checkout.id}/complete.json`;
      console.log(url);
      const request = await this.fetchRequest(url, draftOrderObject);

      // if (![200, 201].includes(request.status))
      //   throw new BadRequestException(
      //     'Unable to process request for checkout. Kindly try again',
      //   );

      const responseData = await request.json();

      console.log(responseData);
    } catch (err) {
      console.log(err);
      throw new BadRequestException('An error occurred processing action');
    }
  }

  async handleRecursiveDraftActionCall(pollUrl: string, token: string) {
    try {
      const fetchDraftDetails = await this.fetchPollDraftOrder(pollUrl, token);

      if (fetchDraftDetails.status !== 200) {
        console.log('Calling data');
        console.log(fetchDraftDetails.status);
        return this.handleRecursiveDraftActionCall(pollUrl, token);
      }

      const responseJson = await fetchDraftDetails.json();
      console.log(responseJson);
      return fetchDraftDetails;
    } catch (err) {
      throw new BadRequestException(
        'An error occurred while fetching draft details.',
      );
    }
  }

  async fetchPollDraftOrder(pollUrl: string, token: string) {
    const draftOrderObject = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
    };
    const request = await this.fetchRequest(pollUrl, draftOrderObject);
    return request;
  }

  async fetchSingleDraftOrder(
    draftOrderId: string,
    token: string,
    shop: string,
  ) {
    const draftOrderObject = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': token,
      },
    };

    const url = `https://${shop}/admin/api/${LATEST_API_VERSION}/draft_orders/${draftOrderId}.json`;
    const request = await this.fetchRequest(url, draftOrderObject);

    return request;
  }
}
