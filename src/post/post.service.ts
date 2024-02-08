import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { PageResponseDto } from '../common/dto/page-response.dto';
import { Category } from '../entity/category.entity';
import { Image } from '../entity/image.entity';
import { Post } from '../entity/post.entity';
import { User } from '../entity/user.entity';
import { CreatePostDto } from './dto/create-post.dto';
import { GetPostDto } from './dto/get-post.dto';
import { PostDetailResponseDto } from './dto/post-detail-response.dto';
import { PostResponseDto } from './dto/post-response.dto';
import { PostCriteria } from './enum/post-criteria.enum';
import { PostPeriod } from './enum/post-period.enum';
import { PostSort } from './enum/post-sort.enum';

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

    const foundPostCount = await qb.getCount();
    const foundPostTotalPage = Math.ceil(foundPostCount / limit);
    if (foundPostTotalPage < pageNo)
      throw new BadRequestException('PAGE_OUT_OF_RANGE');

    const foundPosts = await qb.getMany();

    const postResponseDtos = foundPosts.map(
      (post) => new PostResponseDto(post),
    );

    return new PageResponseDto(pageNo, foundPostCount, limit, postResponseDtos);
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
}
