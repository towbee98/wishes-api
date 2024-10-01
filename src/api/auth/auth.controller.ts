import { Body, Controller, Post, Put } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { AuthUser, Public } from 'src/decorators/auth';
import {
  AuthDto,
  AuthType,
  AuthenticatedAccountDto,
  ResendTokenDto,
  UpdateFirstNameDto,
  VerifyTokenDto,
} from './dtos/AuthDtos';
import { APIResponse } from 'src/types/APIResponse';

@Controller('auth')
@ApiTags('Auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {
    //
  }

  @Post('authentication')
  @Public()
  async authentication(@Body() authDto: AuthDto) {
    const authAccount = await this.authService.authentication(authDto);
    return new APIResponse<AuthenticatedAccountDto>({
      user: authAccount,
      isFullNameRequired: authAccount.isFullNameRequired,
      otpRequired: authDto.type === AuthType.GOOGLE ? false : true,
      token:
        authDto.type === AuthType.GOOGLE
          ? await this.authService.signToken(authAccount)
          : null,
    });
  }

  @Post('verify-code')
  @Public()
  async verifyToken(@Body() verifyTokenDto: VerifyTokenDto) {
    const verifyToken = await this.authService.verifyToken(verifyTokenDto);
    return new APIResponse<AuthenticatedAccountDto>({
      user: verifyToken.data,
      isFullNameRequired: verifyToken.isFirstNameRequired,
      otpRequired: false,
      token: await this.authService.signToken(verifyToken.data),
    });
  }

  @Put('update-first-name')
  async updateFirstName(
    @Body() updateFirstName: UpdateFirstNameDto,
    @AuthUser() authUser,
  ) {
    const verifyToken = await this.authService.updateFirstName(
      updateFirstName,
      authUser._id,
    );
    return new APIResponse<AuthenticatedAccountDto>({
      user: verifyToken.data,
      isFullNameRequired: verifyToken.isFirstNameRequired,
      otpRequired: false,
      token: await this.authService.signToken(verifyToken.data),
    });
  }

  @Post('resend-code')
  @Public()
  async resendCode(@Body() resendCode: ResendTokenDto) {
    await this.authService.resendToken(resendCode);
    return new APIResponse<any>({
      message: 'Code resent successfully',
    });
  }
}
