import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PostCategory } from './enum/post-category.enum';
import { ImageService } from './image.service';
import { PostController } from './post.controller';
import { PostService } from './post.service';
import { CustomMulterFile } from './type/custom-multer-file.type';

describe('PostController', () => {
  let postController: PostController;

  const mockPostService = {
    createPost: jest.fn(),
    getPosts: jest.fn(),
    getPostDetail: jest.fn(),
    updatePost: jest.fn(),
  };
  const mockImageService = {};

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        ConfigService,
        {
          provide: PostService,
          useValue: mockPostService,
        },
        {
          provide: ImageService,
          useValue: mockImageService,
        },
      ],
    }).compile();

    postController = module.get<PostController>(PostController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(postController).toBeDefined();
  });

  describe('createPost()', () => {
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const images = [{ location: 'test.com' }];
    const createPostDto = {
      title: 'test',
      content: 'test',
      category: PostCategory.NOTICE,
    };

    it('SUCCESS: 포스트 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyCreatePostFn = jest.spyOn(mockPostService, 'createPost');

      const expectedResult = {
        message: 'CREATE_SUCCESS',
        statusCode: 201,
      };

      // When
      const result = await postController.createPost(
        user,
        images as CustomMulterFile[],
        createPostDto,
      );

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCreatePostFn).toHaveBeenCalledTimes(1);
      expect(spyCreatePostFn).toHaveBeenCalledWith(
        user,
        images as CustomMulterFile[],
        createPostDto,
      );
    });
  });

  describe('getPosts()', () => {
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
    const mockPostResponseDtos = [
      {
        id: 1,
        title: '치킨',
        viewCount: 1,
        createdAt: new Date(),
        user: {
          id: 1,
          nickname: '사과',
        },
      },
    ];
    const mockPageResponseDto = {
      currentPage: getPostDto.pageNo,
      pageSize: getPostDto.getLimit(),
      totalCount: mockPostResponseDtos.length,
      totalPage: Math.ceil(mockPostResponseDtos.length / getPostDto.getLimit()),
      items: mockPostResponseDtos,
    };

    it('SUCCESS: 포스트 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyGetPostsFn = jest.spyOn(mockPostService, 'getPosts');
      spyGetPostsFn.mockResolvedValueOnce(mockPageResponseDto);

      const expectedResult = {
        message: 'READ_SUCCESS',
        statusCode: 200,
        data: mockPageResponseDto,
      };

      // When
      const result = await postController.getPosts(getPostDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyGetPostsFn).toHaveBeenCalledTimes(1);
      expect(spyGetPostsFn).toHaveBeenCalledWith(getPostDto);
    });
  });

  describe('getPostDetail()', () => {
    const postId = 1;
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const mockPostDetailResponseDto = {
      id: 1,
      title: 'test',
      content: 'test',
      viewCount: 1,
      createdAt: new Date(),
      category: {
        id: 1,
        name: PostCategory.NOTICE,
      },
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
      isMyPost: false,
    };

    it('SUCCESS: 포스트 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyGetPostDetailFn = jest.spyOn(mockPostService, 'getPostDetail');
      spyGetPostDetailFn.mockResolvedValueOnce(mockPostDetailResponseDto);

      const expectedResult = {
        message: 'READ_SUCCESS',
        statusCode: 200,
        data: mockPostDetailResponseDto,
      };

      // When
      const result = await postController.getPostDetail(postId, user);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyGetPostDetailFn).toHaveBeenCalledTimes(1);
      expect(spyGetPostDetailFn).toHaveBeenCalledWith(postId, user.id);
    });
  });

  describe('updatePost()', () => {
    const postId = 1;
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const images = [
      {
        location: 'updateTest.test.com',
      },
    ];
    const updatePostDto = {
      title: 'updateTest',
      content: 'updateTest,',
    };

    it('SUCCESS: 포스트 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyUpdatePostFn = jest.spyOn(mockPostService, 'updatePost');

      const expectedResult = {
        message: 'UPDATE_SUCCESS',
        statusCode: 200,
      };

      // When
      const result = await postController.updatePost(
        postId,
        user,
        images as CustomMulterFile[],
        updatePostDto,
      );

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyUpdatePostFn).toHaveBeenCalledTimes(1);
      expect(spyUpdatePostFn).toHaveBeenCalledWith(
        postId,
        user.id,
        images,
        updatePostDto,
      );
    });
  });
});
