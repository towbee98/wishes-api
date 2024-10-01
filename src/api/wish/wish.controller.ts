import {
  Body,
  ConflictException,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Put,
  Query,
  Redirect,
  Req,
  Res,
} from '@nestjs/common';
import { WishService } from './wish.service';
import {
  CompleteCheckout,
  CreateWishsDto,
  HideWishDto,
  InitCheckout,
  PriorityDto,
  SortWishDto,
  StoreSettingsDto,
  SupportDto,
  UpdateWishPoDescription,
} from './dtos/CreateWishsDtos';
import { APIResponse } from 'src/types/APIResponse';
import { ApiTags } from '@nestjs/swagger';
import { AllowBoth, AuthUser, Public } from 'src/decorators/auth';
import { ShopifyService } from 'src/services/shopify/shopify.service';
import { Logger } from '@nestjs/common';

@Controller('wish')
@ApiTags('wish')
export class WishController {
  constructor(
    private readonly wishService: WishService,
    private readonly shopifyService: ShopifyService,
  ) {
    //
  }

  @Post('/')
  @HttpCode(201)
  async createWish(
    @Body() createWishDto: CreateWishsDto,
    @AuthUser() authUser,
  ): Promise<APIResponse<any>> {
    const wish = await this.wishService.createWish(createWishDto, authUser._id);
    if (!wish) throw new ConflictException('Product has been added already');
    return new APIResponse<any>(wish);
  }

  @Get('/views')
  // @AllowBoth()
  async getWishpoViews(@AuthUser() authUser: any) {
    const wishViews = await this.wishService.fetchUserWishpoViews(
      authUser?._id,
    );

    return new APIResponse<any>(wishViews);
  }

  @Get('/:id')
  async getWishByOrderId(
    @Param('id') id: string,
    @AuthUser() authUser,
    @Query('variant') variant: string,
  ) {
    const wish = await this.wishService.getWishById(id, authUser._id, variant);
    return new APIResponse<any>(wish);
  }

  @Get('/')
  async getWish(@AuthUser() authUser) {
    const wish = await this.wishService.wish(authUser._id);
    return new APIResponse(wish);
  }

  @Get('/user/:username')
  @AllowBoth()
  async getWishByUsername(
    @Param('username') username,
    @AuthUser() authUser: any,
    @Query('search') search: string,
  ) {
    const wish = await this.wishService.wishByUsername(
      username,
      authUser?._id,
      search,
    );
    return new APIResponse<any>(wish);
  }

  @Get('/user/:username/:id')
  @AllowBoth()
  async getWishByWishId(@Param('id') id) {
    const wish = await this.wishService.wishById(id);
    return new APIResponse<any>(wish);
  }

  @Put('/sort')
  async sortWishlist(@AuthUser() auth, @Body() sortWishDto: SortWishDto) {
    const wish = await this.wishService.sortWishlist(auth._id, sortWishDto);
    return new APIResponse<any>(wish);
  }

  @Put('/hide-wish')
  async hideWishItem(@Body() body: HideWishDto) {
    const wish = await this.wishService.hideWideWishList(body.id);
    return new APIResponse<any>(wish);
  }

  @Put('/remove-wish')
  async deleteWishItem(@Body() body: HideWishDto) {
    const wish = await this.wishService.deleteWideWishList(body.id);
    return new APIResponse<any>({
      message: 'Wishpo item deleted successfully',
    });
  }

  @Put('/update-wish-description')
  async updateWishDescription(
    @Body() body: UpdateWishPoDescription,
    @AuthUser() auth,
  ) {
    const wish = await this.wishService.updateWishDescription(body, auth._id);
    return new APIResponse<any>(wish);
  }

  @Post('/add-priority')
  async addPriority(@Body() body: PriorityDto, @AuthUser() auth) {
    const wish = await this.wishService.makePriority(body, auth._id);
    return new APIResponse<any>({ message: 'Priority add successfully' });
  }

  @Post('/remove-priority')
  async removePriority(@Body() body: PriorityDto, @AuthUser() auth) {
    const wish = await this.wishService.removePriority(body);
    return new APIResponse<any>({ message: 'Priority removed successfully' });
  }

  /**
   * @Deprecated
   * Gets wish controller
   * @param body 
   * @returns  
   */
  @Get('/shopify/store-init')
  @AllowBoth()
  @Redirect()
  async shopifyInitStore(@Query() body) {
    const auth = await this.shopifyService.initProviderRegister(body);
    return auth;
  }

  @Post('/shopify/initialize-store')
  @AllowBoth()
  async shopifyInitializeStore(@Query() query) {
    const auth = await this.shopifyService.initStore(query);
    return new APIResponse<any>(auth);
  }

  @Get('/shopify/complete-installation')
  @AllowBoth()
  @Redirect()
  async shopifyCompleteInstallation(@Query() query) {
    const auth = await this.shopifyService.completeInstallation(query);
    return auth;
  }

  @Put('/shopify/settings')
  @AllowBoth()
  @Redirect()
  async settings(@Body() body: StoreSettingsDto) {
    const auth = await this.shopifyService.settings(body );
    return new APIResponse<any>({'message' : 'Settings updated successfully'});
  }

  @Post('/shopify/ticket')
  @AllowBoth()
  @Redirect()
  async support(@Body() body: SupportDto) {
    const auth = await this.shopifyService.submitTicket(body);
    return new APIResponse<any>({'message' : 'Ticket submitted successfully'});
  }

  /**
   * @Deprecated
   * Gets wish controller
   * @param body 
   * @returns  
   */
  @Get('/shopify/authenticate-provider')
  @AllowBoth()
  @Redirect()
  async shopifyVerify(@Query() body) {
    const auth = await this.shopifyService.authenticateProvider(body);
    return auth;
  }

  @Post('/init-checkout')
  @Public()
  async checkoutWish(@Body() initCheckout: InitCheckout) {
    const checkout = await this.wishService.checkout(initCheckout);
    return new APIResponse<any>(checkout);
  }

  @Post('/complete-checkout')
  @AllowBoth()
  async completeCheckOut(@Body() initCheckout: CompleteCheckout) {
    const checkout = await this.wishService.completeCheckout(initCheckout);
    return new APIResponse<any>(checkout);
  }

  @Post('/create-order')
  async createOrder(@Body() order: InitCheckout) {
    const createOrder = await this.wishService.createOrder(order);
    return new APIResponse<any>(createOrder);
  }
}
