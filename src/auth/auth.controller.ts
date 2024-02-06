import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GetUser } from '../common/decorator/get-user.decorator';
import { IsPublic } from '../common/decorator/is-public.decorator';
import { CommonResponseDto } from '../common/dto/common-response.dto';
import { ResponseMessage } from '../common/dto/response-message.enum';
import { User } from '../entity/user.entity';
import { AuthService } from './auth.service';
import { DoLoginDto } from './dto/do-login.dto';
import { TokenDto } from './dto/token.dto';
import { RefreshTokenAuthGuard } from './guard/refresh-token-auth.guard';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  @IsPublic()
  async doLogin(
    @Body() doLoginDto: DoLoginDto,
  ): Promise<CommonResponseDto<TokenDto>> {
    const result = await this.authService.doLogin(doLoginDto);

    return CommonResponseDto.success<TokenDto>(
      ResponseMessage.LOGIN_SUCCESS,
    ).setData(result);
  }

  @HttpCode(HttpStatus.OK)
  @Post('/reissue')
  @UseGuards(RefreshTokenAuthGuard)
  async reissueAccessToken(
    @GetUser() user: User,
  ): Promise<CommonResponseDto<TokenDto>> {
    const result = await this.authService.reissueAccessToken(user);

    return CommonResponseDto.success<TokenDto>(
      ResponseMessage.REISSUE_SUCCESS,
    ).setData(result);
  }
}
