import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFiles,
  UseFilters,
  UseInterceptors,
} from '@nestjs/common';
import { GetUser } from '../common/decorator/get-user.decorator';
import { IsPublic } from '../common/decorator/is-public.decorator';
import { CommonResponseDto } from '../common/dto/common-response.dto';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { ResponseMessage } from '../common/dto/response-message.enum';
import { User } from '../entity/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import { PostDetailResponseDto } from './dto/post-detail-response.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostExceptionFilter } from './filter/post-exception.filter';
import { ImageInterceptor } from './interceptor/image.interceptor';
import { PostService } from './post.service';
import { CustomMulterFile } from './type/custom-multer-file.type';

@Controller('/posts')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Post()
  @UseInterceptors(ImageInterceptor)
  @UseFilters(PostExceptionFilter)
  async createPost(
    @GetUser() user: User,
    @UploadedFiles() images: CustomMulterFile[],
    @Body() createPostDto: CreatePostDto,
  ): Promise<CommonResponseDto<void>> {
    await this.postService.createPost(user, images, createPostDto);

    return CommonResponseDto.success(ResponseMessage.CREATE_SUCCESS);
  }

  @Get()
  @IsPublic()
  async getPosts(
    @Query() getPostDto: GetPostDto,
  ): Promise<CommonResponseDto<PageResponseDto<PostResponseDto>>> {
    const result = await this.postService.getPosts(getPostDto);

    return CommonResponseDto.success<PageResponseDto<PostResponseDto>>(
      ResponseMessage.READ_SUCCESS,
    ).setData(result);
  }

  @Get('/:postId')
  @IsPublic()
  async getPostDetail(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() user?: User,
  ): Promise<CommonResponseDto<PostDetailResponseDto>> {
    const result = await this.postService.getPostDetail(postId, user?.id);

    return CommonResponseDto.success<PostDetailResponseDto>(
      ResponseMessage.READ_SUCCESS,
    ).setData(result);
  }

  @Patch('/:postId')
  @UseInterceptors(ImageInterceptor)
  @UseFilters(PostExceptionFilter)
  async updatePost(
    @Param('postId', ParseIntPipe) postId: number,
    @GetUser() user: User,
    @UploadedFiles() images: CustomMulterFile[],
    @Body() updatePostDto: UpdatePostDto,
  ): Promise<CommonResponseDto<void>> {
    await this.postService.updatePost(postId, user.id, images, updatePostDto);

    return CommonResponseDto.success<void>(ResponseMessage.UPDATE_SUCCESS);
  }
}
