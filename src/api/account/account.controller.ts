import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AccountService } from './account.service';
import { AllowBoth, AuthUser, Public } from 'src/decorators/auth';
import {
  SettingsUpdateDto,
  UpdateAccountDto,
  UpdateShippingDto,
  UploadFileDto,
} from './UpdateAccountDto';
import { ApiBody, ApiConsumes, ApiOperation, ApiTags } from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { APIResponse } from 'src/types/APIResponse';
import { WishService } from '../wish/wish.service';


@Controller('account')
@ApiTags('Account')
export class AccountController {
  constructor(
    private readonly accountService: AccountService,
    private readonly wishService: WishService,
    
  ) {
    //
  }

  //@Get('/stores')
  // @Public()
  // async fetchStores(@AuthUser() auth ) {
  //   console.log(auth)
  //   const stores = await this.accountService.stores()
  //   if(!auth ) return new APIResponse(stores);

  // }
  
  @Put('/')
  @ApiOperation({ summary: 'Update user account information' })
  async updateAccount(
    @AuthUser() auth,
    @Body() updateAccountDto: UpdateAccountDto,
  ) {
    const account = await this.accountService.updateUserProfile(
      updateAccountDto,
      auth._id,
    );
    return new APIResponse<any>(account);
  }

  @Get('/purchased')
  async getPurchasedForMe(
    @AuthUser() authUser: any,
    @Query('search') search: string,
  ) {
    const wish = await this.wishService.purchasedForMe(authUser._id, search);
    return new APIResponse<any>(wish);
  }

  @Get('/check-user/:username')
  @AllowBoth()
  async checkUsername(@AuthUser() auth, @Param() username: any) {
    const account = await this.accountService.checkUsername(
      username.username,
      auth?._id,
    );
    return new APIResponse<any>(account);
  }

  @Put('/shipping-information')
  async updateShippingProfile(
    @AuthUser() auth,
    @Body() updateAccountDto: UpdateShippingDto,
  ) {
    const account = await this.accountService.updateShippingInformation(
      updateAccountDto,
      auth._id,
    );
    return new APIResponse<any>(account);
  }

  @Put('/settings')
  async updateSettings(
    @AuthUser() auth,
    @Body() updateAccountDto: SettingsUpdateDto,
  ) {
    const account = await this.accountService.updateSettings(
      updateAccountDto,
      auth._id,
    );
    return new APIResponse<any>(account);
  }

  @Get('/')
  async profile(@AuthUser() auth) {
    const account = await this.accountService.profile(auth._id);
    return new APIResponse<any>(account);
  }

  @Delete('/')
  async deleteAccount(@AuthUser() auth) {
    const account = await this.accountService.deleteUserAccount(auth._id);
    return new APIResponse<any>(account);
  }

  @Post('/upload-avatar')
  @UseInterceptors(FileInterceptor('avatar'))
  @ApiBody({
    required: true,
    type: 'multipart/form-data',
    schema: {
      type: 'object',
      properties: {
        avatar: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async uploadAvatar(@UploadedFile() file: UploadFileDto, @AuthUser() auth) {
    const upload = await this.accountService.uploadAvatar(file, auth._id);
    return new APIResponse<any>(upload);
  }

  
}
