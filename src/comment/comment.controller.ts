import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
} from '@nestjs/common';
import { GetUser } from '../common/decorator/get-user.decorator';
import { IsPublic } from '../common/decorator/is-public.decorator';
import { CommonResponseDto } from '../common/dto/common-response.dto';
import { PageRequestDto } from '../common/dto/page-request.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { ResponseMessage } from '../common/dto/response-message.enum';
import { User } from '../entity/user.entity';
import { CommentService } from './comment.service';
import { CommentResponseDto } from './dto/comment-response.dto';
import { CreateCommentDto } from './dto/create-comment.dto';

@Controller('/posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  async createComment(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() user: User,
    @Body() createCommentDto: CreateCommentDto,
  ): Promise<CommonResponseDto<void>> {
    await this.commentService.createComment(postId, user, createCommentDto);

    return CommonResponseDto.success(ResponseMessage.CREATE_SUCCESS);
  }

  @Get()
  @IsPublic()
  async getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query() pageRequestDto: PageRequestDto,
    @GetUser() user?: User,
  ): Promise<CommonResponseDto<PageResponseDto<CommentResponseDto>>> {
    const result = await this.commentService.getComments(
      postId,
      pageRequestDto,
      user?.id,
    );

    return CommonResponseDto.success<PageResponseDto<CommentResponseDto>>(
      ResponseMessage.READ_SUCCESS,
    ).setData(result);
  }
}
