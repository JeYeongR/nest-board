import {
  Body,
  Controller,
  Post,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { GetUser } from '../common/decorator/get-user.decorator';
import { CommonResponseDto } from '../common/dto/common-response.dto';
import { ResponseMessage } from '../common/dto/response-message.enum';
import { User } from '../entity/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { PostExceptionFilter } from './filter/post-exception.filter';
import { PostService } from './post.service';

@Controller('/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(FilesInterceptor('images'))
  @UseFilters(PostExceptionFilter)
  async createPost(
    @GetUser() user: User,
    @UploadedFiles() images: Express.MulterS3.File[],
    @Body() createPostDto: CreatePostDto,
  ): Promise<CommonResponseDto<void>> {
    await this.postService.createPost(user, images, createPostDto);

    return CommonResponseDto.success(ResponseMessage.CREATE_SUCCESS);
  }
}
