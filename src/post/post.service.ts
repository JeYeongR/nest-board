import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { Category } from '../entity/category.entity';
import { Image } from '../entity/image.entity';
import { Post } from '../entity/post.entity';
import { User } from '../entity/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import { PostDetailResponseDto } from './dto/post-detail-response.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostCriteria } from './enum/post-criteria.enum';
import { PostPeriod } from './enum/post-period.enum';
import { PostSort } from './enum/post-sort.enum';
import { ImageService } from './image.service';
import { CustomMulterFile } from './type/custom-multer-file.type';

@Injectable()
export class PostService {
  constructor(
    @InjectRepository(Post)
    private readonly postRepository: Repository<Post>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly imageService: ImageService,
    private readonly dataSource: DataSource,
  ) {}

  async createPost(
    user: User,
    images: CustomMulterFile[],
    createPostDto: CreatePostDto,
  ): Promise<void> {
    const { title, content, category } = createPostDto;

    const foundCategory = await this.categoryRepository.findOneBy({
      name: category,
    });
    if (!foundCategory) throw new NotFoundException('NOT_FOUND_CATEGORY');

    const imageEntities = this.mapImageFileToEntity(images);
    const post = this.postRepository.create({
      title,
      content,
      user,
      images: imageEntities,
      category: foundCategory,
    });

    await this.postRepository.save(post);
  }

  // TODO: 시간 남으면 리팩터링하기
  async getPosts(
    getPostDto: GetPostDto,
  ): Promise<PageResponseDto<PostResponseDto>> {
    const { category, keyword, criteria, sort, period, pageNo } = getPostDto;
    const foundCategory = await this.categoryRepository.findOneBy({
      name: category,
    });
    if (!foundCategory) throw new NotFoundException('NOT_FOUND_CATEGORY');

    const limit = getPostDto.getLimit();
    const offset = getPostDto.getOffset();
    const qb = this.postRepository
      .createQueryBuilder('p')
      .leftJoinAndSelect('p.user', 'u')
      .where('p.category_id = :id', { id: foundCategory.id })
      .limit(limit)
      .offset(offset);

    if (keyword) {
      if (criteria === PostCriteria.TITLE) {
        qb.andWhere('MATCH(p.title) AGAINST (:keyword IN BOOLEAN MODE)', {
          keyword: `+${keyword}`,
        });
      } else if (criteria === PostCriteria.WRITER) {
        qb.andWhere('MATCH(u.nickname) AGAINST (:keyword IN BOOLEAN MODE)', {
          keyword: `+${keyword}`,
        });
      } else {
        qb.andWhere(
          'MATCH(p.title) AGAINST (:keyword IN BOOLEAN MODE) OR MATCH(u.nickname) AGAINST (:keyword IN BOOLEAN MODE)',
          { keyword: `+${keyword}` },
        );
      }
    }

    if (sort === PostSort.POPULARITY) {
      const date = this.calculateStartDate(period);
      if (date) qb.andWhere('p.created_at >= :date', { date });

      qb.orderBy({
        'p.view_count': 'DESC',
        'p.created_at': 'DESC',
      });
    } else {
      qb.orderBy({
        'p.created_at': 'DESC',
        'p.title': 'ASC',
      });
    }

    const foundPostsCount = await qb.getCount();
    const foundPostTotalPage = Math.ceil(foundPostsCount / limit);
    if (foundPostTotalPage < pageNo)
      throw new BadRequestException('PAGE_OUT_OF_RANGE');

    const foundPosts = await qb.getMany();

    const postResponseDtos = foundPosts.map(
      (post) => new PostResponseDto(post),
    );

    return new PageResponseDto(
      pageNo,
      foundPostsCount,
      limit,
      postResponseDtos,
    );
  }

  async getPostDetail(
    postId: number,
    userId?: number,
  ): Promise<PostDetailResponseDto> {
    const foundPost = await this.postRepository.findOne({
      where: { id: postId },
      relations: {
        user: true,
        category: true,
        images: true,
      },
    });
    if (!foundPost) throw new NotFoundException('NOT_FOUND_POST');

    foundPost.viewCount++;

    await this.postRepository.save(foundPost);

    return new PostDetailResponseDto(foundPost, userId);
  }

  async updatePost(
    postId: number,
    userId: number,
    images: CustomMulterFile[],
    updatePostDto: UpdatePostDto,
  ): Promise<void> {
    const foundPost = await this.postRepository.findOne({
      where: {
        id: postId,
        user: { id: userId },
      },
      relations: { images: true },
    });
    if (!foundPost) throw new NotFoundException('NOT_FOUND_POST');

    const foundImages = foundPost.images;
    const imageEntities = this.mapImageFileToEntity(images);
    const { title, content } = updatePostDto;
    foundPost.images = imageEntities;
    foundPost.title = title;
    foundPost.content = content;

    await this.dataSource.transaction(async (entityManager) => {
      await entityManager.save(foundPost);

      await Promise.all(
        foundImages.map((image) => entityManager.delete(Image, image.id)),
      );
    });

    await this.deleteImage(foundImages);
  }

  async deletePost(postId: number, userId: number): Promise<void> {
    const foundPost = await this.postRepository.findOne({
      where: {
        id: postId,
        user: { id: userId },
      },
      relations: { images: true },
    });
    if (!foundPost) throw new NotFoundException('NOT_FOUND_POST');

    await this.postRepository.remove(foundPost);

    await this.deleteImage(foundPost.images);
  }

  private calculateStartDate(period: PostPeriod): Date | null {
    const date = new Date();
    if (period === PostPeriod.ONE_YEAR) {
      date.setFullYear(date.getFullYear() - 1);
    } else if (period === PostPeriod.ONE_MONTH) {
      date.setMonth(date.getMonth() - 1);
    } else if (period === PostPeriod.ONE_WEEK) {
      date.setDate(date.getDate() - 7);
    } else {
      return null;
    }

    return date;
  }

  private mapImageFileToEntity(images: CustomMulterFile[]): Image[] {
    return images.map((image) => this.imageService.createImage(image));
  }

  private async deleteImage(images: Image[]): Promise<void> {
    await Promise.all(
      images.map((image) => {
        const key = image.url.substring(this.imageService.s3Url.length + 1);
        this.imageService.deleteImageOnS3(key);
      }),
    );
  }
}
