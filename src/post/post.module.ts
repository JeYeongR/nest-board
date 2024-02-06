import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { TypeOrmModule } from '@nestjs/typeorm';
import { multerConfig } from '../config/multer.config';
import { Category } from '../entity/category.entity';
import { Image } from '../entity/image.entity';
import { Post } from '../entity/post.entity';
import { PostController } from './post.controller';
import { PostService } from './post.service';

@Module({
  imports: [
    MulterModule.registerAsync(multerConfig),
    TypeOrmModule.forFeature([Post, Category, Image]),
  ],
  providers: [PostService],
  controllers: [PostController],
})
export class PostModule {}
