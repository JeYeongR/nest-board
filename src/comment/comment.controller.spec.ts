import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

describe('CommentController', () => {
  let commentController: CommentController;

  const mockCommentService = {
    createComment: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommentController],
      providers: [
        {
          provide: CommentService,
          useValue: mockCommentService,
        },
      ],
    }).compile();

    commentController = module.get<CommentController>(CommentController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(commentController).toBeDefined();
  });

  describe('createComment()', () => {
    const postId = 1;
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const createCommentDto = {
      content: 'test',
    };

    it('SUCCESS: 코멘트 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyCreateCommentFn = jest.spyOn(
        mockCommentService,
        'createComment',
      );

      const expectedResult = {
        message: 'CREATE_SUCCESS',
        statusCode: 201,
      };

      // When
      const result = await commentController.createComment(
        postId,
        user,
        createCommentDto,
      );

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCreateCommentFn).toHaveBeenCalledTimes(1);
      expect(spyCreateCommentFn).toHaveBeenCalledWith(
        postId,
        user,
        createCommentDto,
      );
    });
  });
});
