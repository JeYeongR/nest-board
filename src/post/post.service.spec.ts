import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Category } from '../entity/category.entity';
import { Image } from '../entity/image.entity';
import { Post } from '../entity/post.entity';
import { PostCategory } from './dto/post-category.enum';
import { PostService } from './post.service';

describe('PostService', () => {
  let postService: PostService;

  const mockPostRepository = {
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockCategoryRepository = {
    findOneBy: jest.fn(),
  };
  const mockImageRepository = {
    create: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PostService,
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
        {
          provide: getRepositoryToken(Category),
          useValue: mockCategoryRepository,
        },
        {
          provide: getRepositoryToken(Image),
          useValue: mockImageRepository,
        },
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
  });

  it('should be defined', () => {
    expect(postService).toBeDefined();
  });

  describe('createPost()', () => {
    const mockCategory = {
      id: 1,
      name: PostCategory.NOTICE,
    };
    const mockImage = {
      id: 1,
      url: 'test.test.com',
    };
    const createPostDto = {
      title: 'test',
      content: 'test',
      category: PostCategory.NOTICE,
    };
    const user = {
      id: 1,
      email: 'test@email',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const mockPost = {
      ...createPostDto,
      user,
      images: [mockImage],
      category: mockCategory,
    };
    const images = [{ location: 'test.com' }];

    it('SUCCESS: 글을 정상적으로 생성한다.', async () => {
      // Given
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(mockCategory);
      const spyImageCreateFn = jest.spyOn(mockImageRepository, 'create');
      spyImageCreateFn.mockReturnValueOnce(mockImage);
      const spyPostCreateFn = jest.spyOn(mockPostRepository, 'create');
      spyPostCreateFn.mockReturnValueOnce(mockPost);
      const spyPostSaveFn = jest.spyOn(mockPostRepository, 'save');

      // When
      const result = await postService.createPost(
        user,
        images as Express.MulterS3.File[],
        createPostDto,
      );

      // Then
      expect(result).toBeUndefined();
      expect(spyCategoryFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledWith({
        name: createPostDto.category,
      });
      expect(spyImageCreateFn).toHaveBeenCalledTimes(1);
      expect(spyImageCreateFn).toHaveBeenCalledWith({
        url: images[0].location,
      });
      expect(spyPostCreateFn).toHaveBeenCalledTimes(1);
      expect(spyPostCreateFn).toHaveBeenCalledWith({
        ...createPostDto,
        user,
        images: [mockImage],
        category: mockCategory,
      });
      expect(spyPostSaveFn).toHaveBeenCalledTimes(1);
      expect(spyPostSaveFn).toHaveBeenCalledWith(mockPost);
    });

    it('FAILURE: 카테고리가 존재하지 않으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await postService.createPost(
          user,
          images as Express.MulterS3.File[],
          createPostDto,
        );

        // Then
      } catch (error) {
        hasThrown = true;
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(error.getResponse()).toEqual({
          error: 'Not Found',
          message: 'NOT_FOUND_CATEGORY',
          statusCode: 404,
        });
      }
      expect(hasThrown).toBeTruthy();
    });
  });
});
