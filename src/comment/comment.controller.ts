import { Body, Controller, Param, ParseIntPipe, Post } from '@nestjs/common';
import { GetUser } from '../common/decorator/get-user.decorator';
import { CommonResponseDto } from '../common/dto/common-response.dto';
import { ResponseMessage } from '../common/dto/response-message.enum';
import { User } from '../entity/user.entity';
import { CommentService } from './comment.service';
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
}
