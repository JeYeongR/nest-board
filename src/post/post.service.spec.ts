import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Category } from '../entity/category.entity';
import { Image } from '../entity/image.entity';
import { Post } from '../entity/post.entity';
import { PostCategory } from './enum/post-category.enum';
import { PostCriteria } from './enum/post-criteria.enum';
import { PostPeriod } from './enum/post-period.enum';
import { PostSort } from './enum/post-sort.enum';
import { PostService } from './post.service';

describe('PostService', () => {
  let postService: PostService;

  const mockPostRepository = {
    create: jest.fn(),
    save: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      leftJoinAndSelect: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      offset: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      orderBy: jest.fn().mockReturnThis(),
      getCount: jest.fn(),
      getMany: jest.fn(),
    })),
    findOne: jest.fn(),
  };
  const mockCategoryRepository = {
    findOneBy: jest.fn(),
  };
  const mockImageRepository = {
    create: jest.fn(),
  };
  const mockDataSource = {
    transaction: jest.fn(),
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
        {
          provide: DataSource,
          useValue: mockDataSource,
        },
      ],
    }).compile();

    postService = module.get<PostService>(PostService);
  });

  afterEach(() => {
    jest.clearAllMocks();
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
      nickname: 'test',
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

  describe('getPosts()', () => {
    const mockCategory = {
      id: 1,
    };
    const postCount = 2;
    const date = new Date();
    const mockDate1 = date.toISOString();
    const mockDate2 = date.setMonth(date.getMonth() - 1);
    const mockPost1 = {
      id: 1,
      title: '치킨',
      content: 'test',
      viewCount: 1,
      createdAt: mockDate1,
      user: {
        id: 1,
        nickname: '사과',
      },
    };
    const mockPost2 = {
      id: 2,
      title: '피자',
      content: 'test',
      viewCount: 2,
      createdAt: mockDate2,
      user: {
        id: 2,
        nickname: '수박',
      },
    };
    const mockPostResponseDto1 = {
      id: 1,
      title: '치킨',
      viewCount: 1,
      createdAt: mockDate1,
      user: {
        id: 1,
        nickname: '사과',
      },
    };
    const mockPostResponseDto2 = {
      id: 2,
      title: '피자',
      viewCount: 2,
      createdAt: mockDate2,
      user: {
        id: 2,
        nickname: '수박',
      },
    };

    it('SUCCESS: 카테고리(category)로 글을 정상적으로 조회한다.', async () => {
      // Given
      const getPostDto = {
        pageNo: 1,
        category: PostCategory.NOTICE,
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const mockPosts = [mockPost1, mockPost2];
      const mockPostResponseDtos = [mockPostResponseDto1, mockPostResponseDto2];
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(mockCategory);
      const qb = mockPostRepository.createQueryBuilder();
      const spyPostQbFn = jest.spyOn(mockPostRepository, 'createQueryBuilder');
      spyPostQbFn.mockReturnValueOnce(qb);
      const spyLeftJoinAndSelectFn = jest.spyOn(qb, 'leftJoinAndSelect');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyLimitFn = jest.spyOn(qb, 'limit');
      const spyOffsetFn = jest.spyOn(qb, 'offset');
      const spyOrderByFn = jest.spyOn(qb, 'orderBy');
      const spyGetCountFn = jest.spyOn(qb, 'getCount');
      spyGetCountFn.mockResolvedValueOnce(postCount);
      const spyGetManyFn = jest.spyOn(qb, 'getMany');
      spyGetManyFn.mockResolvedValueOnce(mockPosts);

      const expectedResult = {
        currentPage: getPostDto.pageNo,
        items: mockPostResponseDtos,
        pageSize: getPostDto.getLimit(),
        totalCount: postCount,
        totalPage: Math.ceil(postCount / getPostDto.getLimit()),
      };

      // When
      const result = await postService.getPosts(getPostDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledWith({
        name: getPostDto.category,
      });
      expect(spyPostQbFn).toHaveBeenCalledTimes(2);
      expect(spyPostQbFn).toHaveBeenCalledWith('p');
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledTimes(1);
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledWith('p.user', 'u');
      expect(spyWhereFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledWith('p.category_id = :id', {
        id: mockCategory.id,
      });
      expect(spyLimitFn).toHaveBeenCalledTimes(1);
      expect(spyLimitFn).toHaveBeenCalledWith(getPostDto.getLimit());
      expect(spyOffsetFn).toHaveBeenCalledTimes(1);
      expect(spyOffsetFn).toHaveBeenCalledWith(getPostDto.getOffset());
      expect(spyOrderByFn).toHaveBeenCalledTimes(1);
      expect(spyOrderByFn).toHaveBeenCalledWith({
        'p.created_at': 'DESC',
        'p.title': 'ASC',
      });
      expect(spyGetCountFn).toHaveBeenCalledTimes(1);
      expect(spyGetManyFn).toHaveBeenCalledTimes(1);
    });

    it('SUCCESS: 카테고리(category), 키워드(keyword)로 글을 정상적으로 조회한다.', async () => {
      // Given
      const getPostDto = {
        pageNo: 1,
        category: PostCategory.NOTICE,
        keyword: '수박',
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const mockPosts = [mockPost2];
      const mockPostResponseDtos = [mockPostResponseDto2];
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(mockCategory);
      const qb = mockPostRepository.createQueryBuilder();
      const spyPostQbFn = jest.spyOn(mockPostRepository, 'createQueryBuilder');
      spyPostQbFn.mockReturnValueOnce(qb);
      const spyLeftJoinAndSelectFn = jest.spyOn(qb, 'leftJoinAndSelect');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyLimitFn = jest.spyOn(qb, 'limit');
      const spyOffsetFn = jest.spyOn(qb, 'offset');
      const spyAndWhereFn = jest.spyOn(qb, 'andWhere');
      const spyOrderByFn = jest.spyOn(qb, 'orderBy');
      const spyGetCountFn = jest.spyOn(qb, 'getCount');
      spyGetCountFn.mockResolvedValueOnce(postCount);
      const spyGetManyFn = jest.spyOn(qb, 'getMany');
      spyGetManyFn.mockResolvedValueOnce(mockPosts);

      const expectedResult = {
        currentPage: getPostDto.pageNo,
        items: mockPostResponseDtos,
        pageSize: getPostDto.getLimit(),
        totalCount: postCount,
        totalPage: Math.ceil(postCount / getPostDto.getLimit()),
      };

      // When
      const result = await postService.getPosts(getPostDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledWith({
        name: getPostDto.category,
      });
      expect(spyPostQbFn).toHaveBeenCalledTimes(2);
      expect(spyPostQbFn).toHaveBeenCalledWith('p');
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledTimes(1);
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledWith('p.user', 'u');
      expect(spyWhereFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledWith('p.category_id = :id', {
        id: mockCategory.id,
      });
      expect(spyLimitFn).toHaveBeenCalledTimes(1);
      expect(spyLimitFn).toHaveBeenCalledWith(getPostDto.getLimit());
      expect(spyOffsetFn).toHaveBeenCalledTimes(1);
      expect(spyOffsetFn).toHaveBeenCalledWith(getPostDto.getOffset());
      expect(spyAndWhereFn).toHaveBeenCalledTimes(1);
      expect(spyAndWhereFn).toHaveBeenCalledWith(
        'MATCH(p.title) AGAINST (:keyword IN BOOLEAN MODE) OR MATCH(u.nickname) AGAINST (:keyword IN BOOLEAN MODE)',
        { keyword: `+${getPostDto.keyword}` },
      );
      expect(spyOrderByFn).toHaveBeenCalledTimes(1);
      expect(spyOrderByFn).toHaveBeenCalledWith({
        'p.created_at': 'DESC',
        'p.title': 'ASC',
      });
      expect(spyGetCountFn).toHaveBeenCalledTimes(1);
      expect(spyGetManyFn).toHaveBeenCalledTimes(1);
    });

    it('SUCCESS: 카테고리(category), 키워드(keyword), 검색 기준(criteria)으로 글을 정상적으로 조회한다.', async () => {
      // Given
      const getPostDto = {
        pageNo: 1,
        category: PostCategory.NOTICE,
        keyword: '치킨',
        criteria: PostCriteria.TITLE,
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const mockPosts = [mockPost1];
      const mockPostResponseDtos = [mockPostResponseDto1];
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(mockCategory);
      const qb = mockPostRepository.createQueryBuilder();
      const spyPostQbFn = jest.spyOn(mockPostRepository, 'createQueryBuilder');
      spyPostQbFn.mockReturnValueOnce(qb);
      const spyLeftJoinAndSelectFn = jest.spyOn(qb, 'leftJoinAndSelect');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyLimitFn = jest.spyOn(qb, 'limit');
      const spyOffsetFn = jest.spyOn(qb, 'offset');
      const spyAndWhereFn = jest.spyOn(qb, 'andWhere');
      const spyOrderByFn = jest.spyOn(qb, 'orderBy');
      const spyGetCountFn = jest.spyOn(qb, 'getCount');
      spyGetCountFn.mockResolvedValueOnce(postCount);
      const spyGetManyFn = jest.spyOn(qb, 'getMany');
      spyGetManyFn.mockResolvedValueOnce(mockPosts);

      const expectedResult = {
        currentPage: getPostDto.pageNo,
        items: mockPostResponseDtos,
        pageSize: getPostDto.getLimit(),
        totalCount: postCount,
        totalPage: Math.ceil(postCount / getPostDto.getLimit()),
      };

      // When
      const result = await postService.getPosts(getPostDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledWith({
        name: getPostDto.category,
      });
      expect(spyPostQbFn).toHaveBeenCalledTimes(2);
      expect(spyPostQbFn).toHaveBeenCalledWith('p');
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledTimes(1);
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledWith('p.user', 'u');
      expect(spyWhereFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledWith('p.category_id = :id', {
        id: mockCategory.id,
      });
      expect(spyLimitFn).toHaveBeenCalledTimes(1);
      expect(spyLimitFn).toHaveBeenCalledWith(getPostDto.getLimit());
      expect(spyOffsetFn).toHaveBeenCalledTimes(1);
      expect(spyOffsetFn).toHaveBeenCalledWith(getPostDto.getOffset());
      expect(spyAndWhereFn).toHaveBeenCalledTimes(1);
      expect(spyAndWhereFn).toHaveBeenCalledWith(
        'MATCH(p.title) AGAINST (:keyword IN BOOLEAN MODE)',
        { keyword: `+${getPostDto.keyword}` },
      );
      expect(spyOrderByFn).toHaveBeenCalledTimes(1);
      expect(spyOrderByFn).toHaveBeenCalledWith({
        'p.created_at': 'DESC',
        'p.title': 'ASC',
      });
      expect(spyGetCountFn).toHaveBeenCalledTimes(1);
      expect(spyGetManyFn).toHaveBeenCalledTimes(1);
    });

    it('SUCCESS: 카테고리(category), 정렬 인기순(sort)으로 글을 정상적으로 조회한다.', async () => {
      // Given
      const getPostDto = {
        pageNo: 1,
        category: PostCategory.NOTICE,
        sort: PostSort.POPULARITY,
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const mockPosts = [mockPost2, mockPost1];
      const mockPostResponseDtos = [mockPostResponseDto2, mockPostResponseDto1];
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(mockCategory);
      const qb = mockPostRepository.createQueryBuilder();
      const spyPostQbFn = jest.spyOn(mockPostRepository, 'createQueryBuilder');
      spyPostQbFn.mockReturnValueOnce(qb);
      const spyLeftJoinAndSelectFn = jest.spyOn(qb, 'leftJoinAndSelect');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyLimitFn = jest.spyOn(qb, 'limit');
      const spyOffsetFn = jest.spyOn(qb, 'offset');
      const spyOrderByFn = jest.spyOn(qb, 'orderBy');
      const spyGetCountFn = jest.spyOn(qb, 'getCount');
      spyGetCountFn.mockResolvedValueOnce(postCount);
      const spyGetManyFn = jest.spyOn(qb, 'getMany');
      spyGetManyFn.mockResolvedValueOnce(mockPosts);

      const expectedResult = {
        currentPage: getPostDto.pageNo,
        items: mockPostResponseDtos,
        pageSize: getPostDto.getLimit(),
        totalCount: postCount,
        totalPage: Math.ceil(postCount / getPostDto.getLimit()),
      };

      // When
      const result = await postService.getPosts(getPostDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledWith({
        name: getPostDto.category,
      });
      expect(spyPostQbFn).toHaveBeenCalledTimes(2);
      expect(spyPostQbFn).toHaveBeenCalledWith('p');
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledTimes(1);
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledWith('p.user', 'u');
      expect(spyWhereFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledWith('p.category_id = :id', {
        id: mockCategory.id,
      });
      expect(spyLimitFn).toHaveBeenCalledTimes(1);
      expect(spyLimitFn).toHaveBeenCalledWith(getPostDto.getLimit());
      expect(spyOffsetFn).toHaveBeenCalledTimes(1);
      expect(spyOffsetFn).toHaveBeenCalledWith(getPostDto.getOffset());
      expect(spyOrderByFn).toHaveBeenCalledTimes(1);
      expect(spyOrderByFn).toHaveBeenCalledWith({
        'p.view_count': 'DESC',
        'p.created_at': 'DESC',
      });
      expect(spyGetCountFn).toHaveBeenCalledTimes(1);
      expect(spyGetManyFn).toHaveBeenCalledTimes(1);
    });

    it('SUCCESS: 카테고리(category), 정렬 인기순(sort), 기간 일주일(period)로 글을 정상적으로 조회한다.', async () => {
      // Given
      const getPostDto = {
        pageNo: 1,
        category: PostCategory.NOTICE,
        sort: PostSort.POPULARITY,
        period: PostPeriod.ONE_WEEK,
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const mockPosts = [mockPost1];
      const mockPostResponseDtos = [mockPostResponseDto1];
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(mockCategory);
      const qb = mockPostRepository.createQueryBuilder();
      const spyPostQbFn = jest.spyOn(mockPostRepository, 'createQueryBuilder');
      spyPostQbFn.mockReturnValueOnce(qb);
      const spyLeftJoinAndSelectFn = jest.spyOn(qb, 'leftJoinAndSelect');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyLimitFn = jest.spyOn(qb, 'limit');
      const spyOffsetFn = jest.spyOn(qb, 'offset');
      const spyAndWhereFn = jest.spyOn(qb, 'andWhere');
      const spyOrderByFn = jest.spyOn(qb, 'orderBy');
      const spyGetCountFn = jest.spyOn(qb, 'getCount');
      spyGetCountFn.mockResolvedValueOnce(postCount);
      const spyGetManyFn = jest.spyOn(qb, 'getMany');
      spyGetManyFn.mockResolvedValueOnce(mockPosts);

      const expectedResult = {
        currentPage: getPostDto.pageNo,
        items: mockPostResponseDtos,
        pageSize: getPostDto.getLimit(),
        totalCount: postCount,
        totalPage: Math.ceil(postCount / getPostDto.getLimit()),
      };

      // When
      const result = await postService.getPosts(getPostDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledWith({
        name: getPostDto.category,
      });
      expect(spyPostQbFn).toHaveBeenCalledTimes(2);
      expect(spyPostQbFn).toHaveBeenCalledWith('p');
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledTimes(1);
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledWith('p.user', 'u');
      expect(spyWhereFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledWith('p.category_id = :id', {
        id: mockCategory.id,
      });
      expect(spyLimitFn).toHaveBeenCalledTimes(1);
      expect(spyLimitFn).toHaveBeenCalledWith(getPostDto.getLimit());
      expect(spyOffsetFn).toHaveBeenCalledTimes(1);
      expect(spyOffsetFn).toHaveBeenCalledWith(getPostDto.getOffset());
      expect(spyAndWhereFn).toHaveBeenCalledTimes(1);
      expect(spyOrderByFn).toHaveBeenCalledTimes(1);
      expect(spyOrderByFn).toHaveBeenCalledWith({
        'p.view_count': 'DESC',
        'p.created_at': 'DESC',
      });
      expect(spyGetCountFn).toHaveBeenCalledTimes(1);
      expect(spyGetManyFn).toHaveBeenCalledTimes(1);
    });

    it('SUCCESS: 카테고리(category), 키워드(keyword), 검색 기준(criteria), 정렬 인기순(sort), 기간 일주일(period)로 글을 정상적으로 조회한다.', async () => {
      // Given
      const getPostDto = {
        pageNo: 1,
        category: PostCategory.NOTICE,
        keyword: '치킨',
        criteria: PostCriteria.TITLE,
        sort: PostSort.POPULARITY,
        period: PostPeriod.ONE_WEEK,
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const mockPosts = [mockPost1];
      const mockPostResponseDtos = [mockPostResponseDto1];
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(mockCategory);
      const qb = mockPostRepository.createQueryBuilder();
      const spyPostQbFn = jest.spyOn(mockPostRepository, 'createQueryBuilder');
      spyPostQbFn.mockReturnValueOnce(qb);
      const spyLeftJoinAndSelectFn = jest.spyOn(qb, 'leftJoinAndSelect');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyLimitFn = jest.spyOn(qb, 'limit');
      const spyOffsetFn = jest.spyOn(qb, 'offset');
      const spyAndWhereFn = jest.spyOn(qb, 'andWhere');
      const spyOrderByFn = jest.spyOn(qb, 'orderBy');
      const spyGetCountFn = jest.spyOn(qb, 'getCount');
      spyGetCountFn.mockResolvedValueOnce(postCount);
      const spyGetManyFn = jest.spyOn(qb, 'getMany');
      spyGetManyFn.mockResolvedValueOnce(mockPosts);

      const expectedResult = {
        currentPage: getPostDto.pageNo,
        items: mockPostResponseDtos,
        pageSize: getPostDto.getLimit(),
        totalCount: postCount,
        totalPage: Math.ceil(postCount / getPostDto.getLimit()),
      };

      // When
      const result = await postService.getPosts(getPostDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCategoryFindOneByFn).toHaveBeenCalledWith({
        name: getPostDto.category,
      });
      expect(spyPostQbFn).toHaveBeenCalledTimes(2);
      expect(spyPostQbFn).toHaveBeenCalledWith('p');
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledTimes(1);
      expect(spyLeftJoinAndSelectFn).toHaveBeenCalledWith('p.user', 'u');
      expect(spyWhereFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledWith('p.category_id = :id', {
        id: mockCategory.id,
      });
      expect(spyLimitFn).toHaveBeenCalledTimes(1);
      expect(spyLimitFn).toHaveBeenCalledWith(getPostDto.getLimit());
      expect(spyOffsetFn).toHaveBeenCalledTimes(1);
      expect(spyOffsetFn).toHaveBeenCalledWith(getPostDto.getOffset());
      expect(spyAndWhereFn).toHaveBeenCalledTimes(2);
      expect(spyAndWhereFn).toHaveBeenCalledWith(
        'MATCH(p.title) AGAINST (:keyword IN BOOLEAN MODE)',
        { keyword: `+${getPostDto.keyword}` },
      );
      expect(spyOrderByFn).toHaveBeenCalledTimes(1);
      expect(spyOrderByFn).toHaveBeenCalledWith({
        'p.view_count': 'DESC',
        'p.created_at': 'DESC',
      });
      expect(spyGetCountFn).toHaveBeenCalledTimes(1);
      expect(spyGetManyFn).toHaveBeenCalledTimes(1);
    });

    it('FAILURE: 카테고리가 존재하지 않으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const getPostDto = {
        pageNo: 1,
        category: PostCategory.NOTICE,
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await postService.getPosts(getPostDto);

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

    it('FAILURE: 최대 페이지를 넘어가면 Bad Request Exception을 반환한다.', async () => {
      // Given
      const getPostDto = {
        pageNo: 2,
        category: PostCategory.NOTICE,
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const spyCategoryFindOneByFn = jest.spyOn(
        mockCategoryRepository,
        'findOneBy',
      );
      spyCategoryFindOneByFn.mockResolvedValueOnce(mockCategory);
      const qb = mockPostRepository.createQueryBuilder();
      const spyPostQbFn = jest.spyOn(mockPostRepository, 'createQueryBuilder');
      spyPostQbFn.mockReturnValueOnce(qb);
      const spyGetCountFn = jest.spyOn(qb, 'getCount');
      spyGetCountFn.mockResolvedValueOnce(postCount);

      // When
      let hasThrown = false;
      try {
        await postService.getPosts(getPostDto);

        // Then
      } catch (error) {
        hasThrown = true;
        expect(error).toBeInstanceOf(BadRequestException);
        expect(error.getStatus()).toEqual(HttpStatus.BAD_REQUEST);
        expect(error.getResponse()).toEqual({
          error: 'Bad Request',
          message: 'PAGE_OUT_OF_RANGE',
          statusCode: 400,
        });
      }
      expect(hasThrown).toBeTruthy();
    });
  });

  describe('getPostDetail()', () => {
    const postId = 1;
    const userId = 1;
    const date = new Date();
    const mockPost = {
      id: postId,
      title: 'test',
      content: 'test',
      viewCount: 0,
      createdAt: date,
      user: {
        id: 1,
        email: 'test@email',
        nickname: 'test',
        password:
          '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
      },
      images: [
        {
          id: userId,
          url: 'test.test.com',
        },
      ],
      category: {
        id: 1,
        name: PostCategory.NOTICE,
      },
    };
    const mockPostIncreasedViewCount = {
      id: postId,
      title: 'test',
      content: 'test',
      viewCount: 1,
      createdAt: date,
      user: {
        id: 1,
        email: 'test@email',
        nickname: 'test',
        password:
          '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
      },
      images: [
        {
          id: userId,
          url: 'test.test.com',
        },
      ],
      category: {
        id: 1,
        name: PostCategory.NOTICE,
      },
    };

    it('SUCCESS: 글 상세를 정상적으로 조회한다.', async () => {
      // Given
      const spyPostFindOneFn = jest.spyOn(mockPostRepository, 'findOne');
      spyPostFindOneFn.mockResolvedValueOnce(mockPost);
      const spyPostSaveFn = jest.spyOn(mockPostRepository, 'save');

      const expectedResult = {
        id: 1,
        title: 'test',
        content: 'test',
        viewCount: 1,
        createdAt: date,
        user: {
          id: 1,
          nickname: 'test',
        },
        image: [
          {
            id: 1,
            url: 'test.test.com',
          },
        ],
        category: {
          id: 1,
          name: 'notice',
        },
        isMyPost: true,
      };

      // When
      const result = await postService.getPostDetail(postId, userId);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyPostFindOneFn).toHaveBeenCalledTimes(1);
      expect(spyPostFindOneFn).toHaveBeenCalledWith({
        where: { id: postId },
        relations: {
          user: true,
          category: true,
          images: true,
        },
      });
      expect(spyPostSaveFn).toHaveBeenCalledTimes(1);
      expect(spyPostSaveFn).toHaveBeenCalledWith(mockPostIncreasedViewCount);
    });

    it('FAILURE: 글이 존재하지 않으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyPostFindOneFn = jest.spyOn(mockPostRepository, 'findOne');
      spyPostFindOneFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await postService.getPostDetail(postId, userId);

        // Then
      } catch (error) {
        hasThrown = true;
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(error.getResponse()).toEqual({
          error: 'Not Found',
          message: 'NOT_FOUND_POST',
          statusCode: 404,
        });
      }
      expect(hasThrown).toBeTruthy();
    });
  });
});
