import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Category } from '../entity/category.entity';
import { Image } from '../entity/image.entity';
import { Post } from '../entity/post.entity';
import { ImageService } from './image.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [TypeOrmModule.forFeature([Post, Category, Image])],
  providers: [PostService, ImageService],
  controllers: [PostController],
})
export class PostModule {}
