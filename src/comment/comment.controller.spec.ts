import { Test, TestingModule } from '@nestjs/testing';
import { CommentController } from './comment.controller';
import { CommentService } from './comment.service';

describe('CommentController', () => {
  let commentController: CommentController;

  const mockCommentService = {
    createComment: jest.fn(),
    getComments: jest.fn(),
    updateComment: jest.fn(),
    deleteComment: jest.fn(),
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

  describe('getComments()', () => {
    const postId = 1;
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const pageRequestDto = {
      pageNo: 1,
      getOffset: function (): number {
        return 0;
      },
      getLimit: function (): number {
        return 10;
      },
    };
    const mockCommentResponseDtos = [
      {
        id: 1,
        content: 'test',
        group: 1,
        sequence: 1,
        depth: 1,
        user: {
          id: 1,
          nickname: 'test',
        },
        isMyComment: true,
      },
    ];
    const mockPageResponseDto = {
      currentPage: pageRequestDto.pageNo,
      pageSize: pageRequestDto.getLimit(),
      totalCount: mockCommentResponseDtos.length,
      totalPage: Math.ceil(
        mockCommentResponseDtos.length / pageRequestDto.getLimit(),
      ),
      items: mockCommentResponseDtos,
    };

    it('SUCCESS: 코멘트 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyGetCommentsFn = jest.spyOn(mockCommentService, 'getComments');
      spyGetCommentsFn.mockResolvedValueOnce(mockPageResponseDto);

      const expectedResult = {
        message: 'READ_SUCCESS',
        statusCode: 200,
        data: mockPageResponseDto,
      };

      // When
      const result = await commentController.getComments(
        postId,
        pageRequestDto,
        user,
      );

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyGetCommentsFn).toHaveBeenCalledTimes(1);
      expect(spyGetCommentsFn).toHaveBeenCalledWith(
        postId,
        pageRequestDto,
        user.id,
      );
    });
  });

  describe('updateComment()', () => {
    const postId = 1;
    const commentId = 1;
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const updateCommentDto = { content: 'test2' };

    it('SUCCESS: 코멘트 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyUpdateCommentFn = jest.spyOn(
        mockCommentService,
        'updateComment',
      );

      const expectedResult = {
        message: 'UPDATE_SUCCESS',
        statusCode: 200,
      };

      // When
      const result = await commentController.updateComment(
        postId,
        commentId,
        user,
        updateCommentDto,
      );

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyUpdateCommentFn).toHaveBeenCalledTimes(1);
      expect(spyUpdateCommentFn).toHaveBeenCalledWith(
        postId,
        commentId,
        user.id,
        updateCommentDto,
      );
    });
  });

  describe('deleteComment()', () => {
    const postId = 1;
    const commentId = 1;
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };

    it('SUCCESS: 코멘트 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyDeleteCommentFn = jest.spyOn(
        mockCommentService,
        'deleteComment',
      );

      const expectedResult = {
        message: 'DELETE_SUCCESS',
        statusCode: 200,
      };

      // When
      const result = await commentController.deleteComment(
        postId,
        commentId,
        user,
      );

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyDeleteCommentFn).toHaveBeenCalledTimes(1);
      expect(spyDeleteCommentFn).toHaveBeenCalledWith(
        postId,
        commentId,
        user.id,
      );
    });
  });
});
