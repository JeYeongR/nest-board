import { ConfigService } from '@nestjs/config';
import { Test, TestingModule } from '@nestjs/testing';
import { PostCategory } from './enum/post-category.enum';
import { PostController } from './post.controller';
import { PostService } from './post.service';

describe('PostController', () => {
  let postController: PostController;

  const mockPostService = {
    createPost: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PostController],
      providers: [
        ConfigService,
        {
          provide: PostService,
          useValue: mockPostService,
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
      const spyCreateUserFn = jest.spyOn(mockPostService, 'createPost');

      const expectedResult = {
        message: 'CREATE_SUCCESS',
        statusCode: 201,
      };

      // When
      const result = await postController.createPost(
        user,
        images as Express.MulterS3.File[],
        createPostDto,
      );

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCreateUserFn).toHaveBeenCalledTimes(1);
      expect(spyCreateUserFn).toHaveBeenCalledWith(
        user,
        images as Express.MulterS3.File[],
        createPostDto,
      );
    });
  });
});
