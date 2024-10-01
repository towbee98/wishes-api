import { Controller, Get, Param, Query } from '@nestjs/common';
import { PartnersService } from './partners.service';
import { Post } from '@nestjs/common';
import { Body } from '@nestjs/common';
import { CreatePartnerDto } from './dtos/CreatePartnersDto';
import { SignInPartnerDto } from './dtos/SignInPartnersDto';
import { APIResponse } from 'src/types/APIResponse';
import { AllowBoth, AuthUser, Public } from 'src/decorators/auth';
import { ApiTags } from '@nestjs/swagger';
import { WishService } from '../wish/wish.service';
import { AdminService } from '../admin/admin.service';
import { AccountService } from '../account/account.service';
import { UtilService } from 'src/services/util/util.service';
@Controller('partners')
@ApiTags('partners')
export class PartnersController {
  constructor(
    private readonly partnerService: PartnersService,
    private readonly wishService: WishService,
    private readonly accountService: AccountService,
    private readonly utilService: UtilService,
  ) {}
  @Post('/create')
  async partnerSignUpAuth(@Body() createPartnerDto: CreatePartnerDto) {
    const partner = await this.partnerService.signUp(createPartnerDto);
    return new APIResponse(partner);
  }

  @Post('/login')
  @Public()
  async partnerSignInAuth(@Body() signInPartnerDto: SignInPartnerDto) {
    const partner = await this.partnerService.signIn(signInPartnerDto);
    return new APIResponse(partner);
  }

  @Get('/topWishlistedItems')
  async fetchTopWishlistedItems(@AuthUser() authUser: any) {
    const wishlists = await this.wishService.fetchTopMostWishlistedItems();
    return new APIResponse(wishlists);
  }

  @Get('/total-purchases')
  async fetchTotalPurchases(@AuthUser() authUser: any) {
    // const totalPurchases = await this.wishService.fetch;
    return new APIResponse({ totalPurchases: 0 });
  }

  @Get('/stores')
  @AllowBoth()
  async fetchStores(@AuthUser() auth, @Query() query) {
    // console.log(query);
    const filter = query.category ? query.category.split(',') : null;

    const result = filter
      ? await this.accountService.stores(query.page, filter)
      : await this.accountService.stores(query.page);
    if (!auth) return new APIResponse(result);

    // const shuffleStore = await this.accountService.checklastStoreFetch(auth.id);
    // if (shuffleStore)
    //   result.stores = await this.utilService.shuffleArray(result.stores);

    return new APIResponse(result);
  }

  @Get('/stores/:id')
  async getPartner(@Param('id') id: string) {
    const store = await this.accountService.getStore(id);
    return new APIResponse(store);
  }
}
