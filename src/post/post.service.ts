import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Category } from '../entity/category.entity';
import { Image } from '../entity/image.entity';
import { Post } from '../entity/post.entity';
import { User } from '../entity/user.entity';
import { CreatePostDto } from './dto/create-post.dto';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
  ) {}

  async createPost(
    user: User,
    images: Express.MulterS3.File[],
    createPostDto: CreatePostDto,
  ): Promise<void> {
    const { title, content, category } = createPostDto;

    const foundCategory = await this.categoryRepository.findOneBy({
      name: category,
    });
    if (!foundCategory) throw new NotFoundException('NOT_FOUND_CATEGORY');

    const imageEntities = images.map((image) =>
      this.imageRepository.create({ url: image.location }),
    );
    const post = this.postRepository.create({
      title,
      content,
      user,
      images: imageEntities,
      category: foundCategory,
    });

    await this.postRepository.save(post);
  }
}
