import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { CommonResponseDto } from '../common/dto/common-response.dto';
import { ResponseMessage } from '../common/dto/response-message.enum';
import { AuthService } from './auth.service';
import { DoLoginDto } from './dto/do-login.dto';
import { TokenDto } from './dto/token.dto';

@Controller('/auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @HttpCode(HttpStatus.OK)
  @Post('/login')
  async doLogin(
    @Body() doLoginDto: DoLoginDto,
  ): Promise<CommonResponseDto<TokenDto>> {
    const result = await this.authService.doLogin(doLoginDto);

    return CommonResponseDto.success<TokenDto>(
      ResponseMessage.LOGIN_SUCCESS,
    ).setData(result);
  }
}
