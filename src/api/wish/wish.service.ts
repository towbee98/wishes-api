import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import {
  IWishStatus,
  Wishs,
  WishsDocument,
} from 'src/database/models/Wishs.model';
import {
  CompleteCheckout,
  CreateWishsDto,
  IFulfillOrder,
  InitCheckout,
  SortWishDto,
  UpdateWishPoDescription,
} from './dtos/CreateWishsDtos';
import { UtilService } from 'src/services/util/util.service';
import { Users, UsersDocument } from 'src/database/models/Users.model';
import { PartnerDocument, Partners } from 'src/database/models/Partners.model';
import { ShopifyService } from 'src/services/shopify/shopify.service';
import { IProviders } from 'src/types/providers.types';
import { StripeService } from 'src/services/stripe/stripe.service';
import { MailService } from 'src/services/mail/mail.service';
import {
  WishViews,
  WishViewsDocument,
} from 'src/database/models/WishsViews.model';

@Injectable()
export class WishService {
  constructor(
    @InjectModel(Wishs.name)
    private readonly wishModel: Model<WishsDocument>,
    private utilService: UtilService,
    @InjectModel(Users.name)
    private readonly userModel: Model<UsersDocument>,
    private shopifyService: ShopifyService,
    private stripeService: StripeService,
    private readonly mailService: MailService,
    @InjectModel(Partners.name)
    private readonly partnerModel: Model<PartnerDocument>,
    @InjectModel(WishViews.name)
    private readonly WishViewsModel: Model<WishViewsDocument>,
  ) {
    //
  }

  async createWish(createWishDto: CreateWishsDto, uid: string) {
    // check variant available
    let selectedVariant = null;

    if (createWishDto.productVariant) {
      const filterVariant = (createWishDto.orderData as any).variants?.filter(
        (data) => data.id == createWishDto.productVariant,
      );
      selectedVariant = filterVariant[0];
    }

    // check if user has added this product before now
    const wish = await this.wishModel.findOne({
      uid,
      item_id: createWishDto.item_id,
      wish_status: { $in: [IWishStatus.PENDING] },
    });

    let proceedToCreate = false;

    if (!wish) {
      proceedToCreate = true;
    } else if (createWishDto.productVariant != wish.productVariant) {
      proceedToCreate = true;
    } else {
      proceedToCreate = false;
    }

    if (!proceedToCreate) {
      return false;
    }

    const averageColor = await this.utilService.getAverageColors(
      'https:' + createWishDto.image,
    );

    if (selectedVariant) {
      createWishDto = {
        ...createWishDto,
        title: selectedVariant?.name,
        amount: selectedVariant?.price,
        image:
          selectedVariant?.featured_media?.preview_image.src ||
          createWishDto.image,
        orderData: {
          ...createWishDto.orderData,
          variants: [selectedVariant],
        },
      };
    }

    const addWish = await this.wishModel.create({
      uid: uid,
      ...createWishDto,
      formattedAmount: createWishDto.amount / 100,
      bgColor: averageColor.join(),
    });

    if (!addWish) {
      throw new BadRequestException('Unable to add to wishpo.');
    }

    const getTotalWishForUser = await this.wishModel.count({
      uid,
      wish_status: {
        $in: [IWishStatus.PENDING],
      },
    });
    proceedToCreate = false;
    // color update
    return {
      total: getTotalWishForUser,
      wish: addWish,
    };
  }

  // the id passed is the provider id
  async getWishById(id: string, uid: string, variant?: string) {
    const totalWishForUser = await this.wishModel.count({
      uid,
      wish_status: IWishStatus.PENDING,
    });

    // Check for the wish item
    const wish = await this.wishModel.findOne({
      item_id: id,
      uid,
      ...(variant ? { 'orderData.productVariant': variant } : {}), // Include variant condition if provided
    });

    if (!wish) {
      return {
        wish: null,
        total: totalWishForUser,
      };
    }

    return {
      wish,
      total: totalWishForUser,
    };
  }

  async wish(uid: string) {
    const wish = await this.wishModel.find({
      uid,
      wish_status: {
        $in: [IWishStatus.PENDING, IWishStatus.HIDDEN, IWishStatus.CANCELED],
      },
    });
    return wish;
  }

  async wishByUsername(username: string, uid: string, search?: string) {
    let status = [];

    const user = await this.userModel
      .findOne({ username: username })
      .select(
        'username firstName lastName phoneNumber address is_account_visible wishDescription avatar',
      );
    if (!user) throw new BadRequestException('User not found');

    const loggedInUser = await this.userModel.findById(uid);
    console.log(loggedInUser);
    if (loggedInUser?.username === username) {
      status = [
        IWishStatus.CANCELED,
        IWishStatus.CLOSED_BY_VENDOR,
        IWishStatus.HIDDEN,
        IWishStatus.PENDING,
      ];
    } else {
      status = [IWishStatus.PENDING];
      const isAllowedToViewPublic = user.is_account_visible;
      if (!isAllowedToViewPublic) {
        // throw new BadRequestException('Not allowed to view this wishpo list');
        return {
          user,
          isVisible: false,
        };
      }
    }

    const match: any = {
      uid: user._id.toString(),
      wish_status: {
        $in: status,
      },
    };
    if (search) {
      match['$text'] = {
        $search: search,
      };
    }

    const wishs = await this.wishModel.aggregate([
      {
        $match: {
          ...match,
        },
      },
    ]);

    let userWishpoViews = await this.WishViewsModel.findOne({ username });
    if (!userWishpoViews)
      userWishpoViews = await this.WishViewsModel.create({ username });
    userWishpoViews.todayViews += 1;
    userWishpoViews.weeklyViews += 1;
    userWishpoViews.totalViews += 1;
    await userWishpoViews.save();
    return {
      user,
      wishs,
      isVisible: true,
    };
  }

  async fetchUserWishpoViews(uid: string) {
    const loggedInUser = await this.userModel.findById(uid);

    let userWishpoViews = await this.WishViewsModel.findOne({
      username: loggedInUser.username,
    });
    console.log(userWishpoViews);

    if (!userWishpoViews)
      userWishpoViews = new this.WishViewsModel({
        username: loggedInUser.username,
      });

    return userWishpoViews;
  }

  async fetchTopMostWishlistedItems() {
    const topItems = await this.wishModel
      .aggregate([
        {
          $group: {
            _id: '$item_Id', // Group by itemId

            wishlistCount: { $sum: 1 }, // Count the number of purchases for each itemId
            itemDetails: { $first: '$$ROOT' },
          },
        },
        {
          $replaceRoot: {
            newRoot: {
              itemId: '$_id',
              wishlistCount: '$',
              itemDetails: '$itemDetails',
            },
          },
        },
        { $sort: { wishlistCount: -1 } }, // Sort by purchaseCount in descending order
        { $limit: 5 }, // Limit to the top 5 items
      ])
      .exec();
    console.log(topItems);
    return topItems;
  }
  async purchasedForMe(uid: string, search?: string) {
    const match: any = {
      uid: uid.toString(),
      wish_status: {
        $in: [IWishStatus.COMPLETED],
      },
    };
    if (search) {
      match['$text'] = {
        $search: search,
      };
    }

    const wishs = await this.wishModel.aggregate([
      {
        $match: {
          ...match,
        },
      },
    ]);

    return {
      wishs,
    };
  }

  // this is the wish id
  async wishById(id: string) {
    const wish = await this.wishModel.findById(id).lean();

    if (!wish) {
      throw new BadRequestException('Wish item not found');
    }

    const user = await this.userModel
      .findById(wish.uid)
      .select(
        'username firstName lastName phoneNumber address is_account_visible wishDescription',
      );

    delete wish.orderData;

    return { wish, user };
  }

  async sortWishlist(id: string, sortWishDto: SortWishDto) {
    let errorHolder: string[] = [];

    for (const key in sortWishDto.sort) {
      const updateSort = await this.wishModel.findByIdAndUpdate(key, {
        sort: sortWishDto.sort[key],
      });

      if (!updateSort) {
        errorHolder = [...errorHolder, id];
      }
    }

    if (errorHolder.length > 0) {
      return {
        message: 'Item sort update failed for some wishpo item',
        errorItem: errorHolder,
      };
    }

    return {
      message: 'Item sort updated successfully',
    };
  }

  async hideWideWishList(id: string) {
    const wishItem = await this.wishModel.findById(id);

    if (!wishItem) throw new BadRequestException('Wish item not found');

    if (wishItem.wish_status == IWishStatus.HIDDEN) {
      await this.wishModel.findByIdAndUpdate(id, {
        wish_status: IWishStatus.PENDING,
      });
    } else {
      await this.wishModel.findByIdAndUpdate(id, {
        wish_status: IWishStatus.HIDDEN,
      });
    }

    return this.wishModel.findById(id);
  }

  async deleteWideWishList(id: string) {
    const wishItem = await this.wishModel.findById(id);
    if (!wishItem) throw new BadRequestException('Wish item not found');
    await this.wishModel.findByIdAndDelete(id);
    return null;
  }

  async updateWishDescription(payload: UpdateWishPoDescription, uid) {
    const wishDescription = await this.userModel.findByIdAndUpdate(uid, {
      wishDescription: payload.description,
    });
    if (!wishDescription) {
      throw new BadRequestException("Couldn't update wish description");
    }
    return this.userModel.findById(uid);
  }

  async makePriority(body: { wish_id: string }, uid: string) {
    // check if the user has any active priority that is more than 3
    const checkPriority = await this.wishModel.find({ uid, is_priority: true });

    if (checkPriority.length >= 3)
      throw new BadRequestException('You cannot have more than 3 priorities');

    await this.wishModel.findByIdAndUpdate(
      { _id: body.wish_id },
      { is_priority: true },
    );

    return null;
  }

  async removePriority(body: { wish_id: string }) {
    // check if the user has any active priority that is more than 3
    const checkPriority = await this.wishModel.findOne({
      _id: body.wish_id,
      is_priority: true,
    });

    if (!checkPriority)
      throw new BadRequestException('This wish item is not set as priority');

    await this.wishModel.findByIdAndUpdate(
      { _id: body.wish_id },
      { is_priority: false },
    );

    return null;
  }

  async checkout(initCheckout: InitCheckout) {
    const getOrder = await this.wishModel.findById(initCheckout.wish_id);

    if (!getOrder) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.userModel.findById(getOrder.uid);

    if (!user?.shippingAddress) {
      throw new NotFoundException('Can not find shipping address');
    }

    const provider = getOrder.provider;

    let preCheckoutFromProvider = null;

    if (provider == IProviders.SHOPIFY) {
      preCheckoutFromProvider = await this.shopifyService.checkout(
        getOrder,
        user,
      );
      // console.log(preCheckoutFromProvider);
    }

    // console.log("It reached here line 384")
    const initStripeIntent = await this.stripeService.startCheckout(
      getOrder,
      preCheckoutFromProvider.amount,
    );
    //const total= preCheckoutFromProvider.
    return {
      ...initStripeIntent,
      tax: preCheckoutFromProvider.tax,
      service_fee: preCheckoutFromProvider.service_fee,
      shipping_fee: preCheckoutFromProvider.shipping_fee,
      total: preCheckoutFromProvider.total,
    };
  }

  async completeCheckout(checkout: CompleteCheckout) {
    const processCheckout = await this.stripeService.completeCheckout(
      checkout.id,
    );

    // update checkout process
    await this.wishModel.findByIdAndUpdate(processCheckout.orderId, {
      paidByInformation: {
        is_anonymous: checkout.is_anonymous,
        last_name: checkout.last_name,
        first_name: checkout.first_name,
        personalized_message: checkout.personalized_message,
        email: checkout.email,
      },
      payment_status: IWishStatus.PAID,
      wish_status: IWishStatus.COMPLETED,
    });

    // proceed to send email store owner, user and user making the payment

    const orderInformation = await this.wishModel.findById(
      processCheckout.orderId,
    );

    const orderOwner = await this.userModel.findById(orderInformation.uid);

    // complete this as draft order to pass it as an order for fulfillment by admin
    // await this.shopifyService.markDraftOrderAsPaid(orderInformation);

    const data = {
      key: 'USER_NOTIFICATION',
      payloads: {
        firstName: orderOwner?.firstName,
        lastName: orderOwner?.lastName,
        name: `${orderOwner?.firstName}`,
        personalized_message: checkout.personalized_message,
        orderInformation: {
          productName: orderInformation.title,
          ...orderInformation.store,
        },
      },
      email: orderOwner.email,
    };
    this.mailService.sendMail(data);

    // admin mail
    const adminData = {
      key: 'ADMIN_NOTIFICATION',
      payloads: {
        firstName: orderOwner?.firstName,
        lastName: orderOwner?.lastName,
        name: `${orderOwner?.firstName} `,
        orderInformation: {
          productName: orderInformation.title,
          ...orderInformation.store,
        },
      },
      email: 'info@wishpo.com',
    };
    this.mailService.sendMail(adminData);

    const storeInformation = orderInformation.store;

    // const storeOwnerNotification = {
    //   key: 'STORE_NOTIFICATION',
    //   payloads: {
    //     firstName: orderOwner?.firstName,
    //     lastName: orderOwner?.lastName,
    //     name: `${orderOwner?.firstName} ${orderOwner?.lastName}`,
    //     orderInformation: {
    //       productName: orderInformation.title,
    //       ...orderInformation.store,
    //     },
    //   },
    //   email: storeInformation?.email,
    // };

    const gifterNotification = {
      key: 'GIFTED_NOTIFICATION',
      payloads: {
        firstName: orderOwner?.firstName,
        lastName: orderOwner?.lastName,
        name: `${orderOwner?.firstName} `,
        orderInformation: {
          productName: orderInformation.title,
          ...orderInformation.store,
        },
      },
      email: checkout.email,
    };
    this.mailService.sendMail(gifterNotification);

    return orderInformation;
  }

  async createOrder(wish: InitCheckout) {
    const getOrder = await this.wishModel.findById(wish.wish_id);

    if (!getOrder) {
      throw new NotFoundException('Order not found');
    }

    const user = await this.userModel.findById(getOrder.uid);

    if (!user.shippingAddress) {
      throw new NotFoundException('Can not find shipping address');
    }

    const provider = getOrder.provider;

    const amount = getOrder.amount;
    console.log(amount);
    if (provider == IProviders.SHOPIFY) {
      return this.shopifyService.createOrder(getOrder, user);
    }
  }

  async fulfilOrder(orderId: string, orderNumber: string) {
    const orderInformation = await this.wishModel.findById(orderId);
    if (!orderInformation) {
      throw new BadRequestException('Order not found');
    }
    if (
      orderInformation.payment_status != 'PAID' &&
      orderInformation.wish_status != 'COMPLETED'
    ) {
      throw new BadRequestException('Order cannot be fulfilled yet');
    }

    if (orderInformation.checkout.isFulfilled) {
      throw new BadRequestException('Order already fulfilled');
    }
    const provider = orderInformation.provider;
    if (provider == IProviders.SHOPIFY) {
      await this.shopifyService.completeOrder(orderInformation);
      await this.wishModel.findByIdAndUpdate(orderId, {
        checkout: {
          ...orderInformation.checkout,
          isFulfilled: true,
          fulfilledDate: Date.now(),
          orderNumber,
        },
      });
    }
    return { message: 'Order fulfilled successfully' };
  }
}
