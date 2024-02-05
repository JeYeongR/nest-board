import { Body, Controller, Post } from '@nestjs/common';
import { CommonResponseDto } from '../common/dto/common-response.dto';
import { ResponseMessage } from '../common/dto/response-message.enum';
import { CreateUserDto } from './dto/create-user.dto';
import { UserService } from './user.service';

@Controller('/users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Post()
  async createUser(
    @Body() createUserDto: CreateUserDto,
  ): Promise<CommonResponseDto<void>> {
    await this.userService.createUser(createUserDto);

    return CommonResponseDto.success(ResponseMessage.CREATE_SUCCESS);
  }
}
