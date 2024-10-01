import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  UploadedFiles,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { AllowBoth, AuthUser, Public } from 'src/decorators/auth';
import { AdminAuth } from '../auth/dtos/AuthDtos';
import { APIResponse } from 'src/types/APIResponse';
import {
  CreateAdminDtos,
  StoreDto,
  PasswordDto,
  UpdateAdminDtos,
  UpdatePasswordDtos,
} from './dtos/CreateAdminDtos';
import { ApiTags } from '@nestjs/swagger';
import { OrderDto, UpdateAccountDto } from '../account/UpdateAccountDto';
import { WishService } from '../wish/wish.service';
import { AnyFilesInterceptor, FileInterceptor } from '@nestjs/platform-express';

@UseGuards(AdminAuth)
@Controller('admin')
@ApiTags('admin')
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly wishService: WishService,
  ) {}

  @Post('/login')
  @Public()
  async adminAuth(@Body() authDto: AdminAuth) {
    const authAccount = await this.adminService.adminAuth(authDto);
    return new APIResponse<{
      data: {
        token: any;
        user: { email: string; name: string; id: any; type: string };
      };
    }>(authAccount);
  }

  @Post('/create')
  @AllowBoth()
  async createAdmin(@Body() createAdminDtos: CreateAdminDtos) {
    const admin = await this.adminService.createAdmins(createAdminDtos);
    if (!admin) {
      throw new BadRequestException(
        'An error occurred while creating admin account',
      );
    }

    return new APIResponse(admin);
  }

  @Put('/update/:id')
  async updateAdmin(
    @Param('id') id: string,
    @Body() updateAdminDtos: UpdateAdminDtos,
  ) {
    const admin = await this.adminService.updateAdmins(id, updateAdminDtos);
    return new APIResponse(admin);
  }

  @Put('/update-password/:id')
  async updatePassword(
    @Param('id') id: string,
    @Body() updateAdminDtos: UpdatePasswordDtos,
  ) {
    const admin = await this.adminService.updatePassword(id, updateAdminDtos);
    return new APIResponse(admin);
  }

  @Get('/users')
  async allUsers() {
    const users = await this.adminService.users();
    return new APIResponse(users);
  }

  @Get('/parters')
  async allPartners() {
    const users = await this.adminService.partners();
    return new APIResponse(users);
  }

  @Get('/stores')
  async allStore() {
    const stores = await this.adminService.stores();
    return new APIResponse(stores);
  }

  @Post('/stores')
  @UseInterceptors(AnyFilesInterceptor({limits:{fileSize: 10 * 1024 * 1024}}))
  async addPartner(
    @UploadedFiles() files: Array<Express.Multer.File>,
    @Body() storeDto: StoreDto,
  ) {
    console.log(storeDto);
    const store = await this.adminService.addStore(storeDto, files);
    return new APIResponse(store);
  }

  @Get('/stores/:id')
  async getPartner(@Param('id') id: string) {
    const store = await this.adminService.getStore(id);
    return new APIResponse(store);
  }

  @Put('/stores/:id')
  async updatePartner(@Param('id') id: string, @Body() storeDto: StoreDto) {
    const store = await this.adminService.updateStore(id, storeDto);
    return new APIResponse(store);
  }
  @Get('/user/:id')
  async user(@Param('id') id: string) {
    const user = await this.adminService.userById(id);
    return new APIResponse(user);
  }

  @Put('/user/:id')
  async updateUser(@Param('id') id: string, @Body() user: UpdateAccountDto) {
    const updateUser = await this.adminService.updateUser(id, user);
    return new APIResponse(updateUser);
  }

  @Delete('/delete-user/:id')
  async deleteUser(@Param('id') id: string) {
    const user = await this.adminService.deleteUser(id);
    return new APIResponse(user);
  }

  @Delete('/delete-wish-item/:id')
  async deleteWishItem(@Param('id') id: string) {
    const wishItem = await this.adminService.deleteWishItem(id);
    return new APIResponse(wishItem);
  }

  @Get('/wish')
  async wish() {
    const wish = await this.adminService.wish();
    return new APIResponse(wish);
  }

  @Get('/wish/:id')
  async wishById(@Param('id') id: string) {
    const wish = await this.adminService.wishById(id);
    return new APIResponse(wish);
  }

  @Put('/fulfil-wish/:id')
  async fulfillOrder(@Param('id') id: string, @Body() orderDto: OrderDto) {
    const wish = await this.wishService.fulfilOrder(id, orderDto.orderNumber);
    return new APIResponse(wish);
  }

  @Get('/')
  async allAdmin() {
    const admin = await this.adminService.admins();
    return new APIResponse(admin);
  }

  @Delete('/delete-admin/:id')
  async deleteAdmin(@Param('id') id: string) {
    const deleteAdmin = await this.adminService.deleteAdmin(id);
    return new APIResponse(deleteAdmin);
  }

  @Get('/profile')
  @AllowBoth()
  async fetchProfile(@AuthUser() authUser) {
    const profile = await this.adminService.getAdmin(authUser._id);
    return new APIResponse(profile);
  }

  @Patch('/profile/update-password')
  @AllowBoth()
  async updatepassword(@AuthUser() authUser, @Body() passwordDto: PasswordDto) {
    const profile = await this.adminService.changePassword(
      authUser._id,
      passwordDto,
    );
    return new APIResponse(profile);
  }
}
