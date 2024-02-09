import { HttpStatus, NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Comment } from '../entity/comment.entity';
import { Post } from '../entity/post.entity';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let commentService: CommentService;

  const mockCommentRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };
  const mockPostRepository = {
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommentService,
        {
          provide: getRepositoryToken(Comment),
          useValue: mockCommentRepository,
        },
        {
          provide: getRepositoryToken(Post),
          useValue: mockPostRepository,
        },
      ],
    }).compile();

    commentService = module.get<CommentService>(CommentService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(commentService).toBeDefined();
  });

  describe('createComment()', () => {
    const postId = 1;
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const mockPost = {
      id: 1,
      title: '치킨',
      content: 'test',
      viewCount: 1,
      createdAt: new Date(),
      user: {
        id: 1,
        nickname: '사과',
      },
    };
    const mockParentComment = {
      id: 1,
      cotent: 'test',
    };
    const mockComment = {
      cotent: 'test',
      user,
      post: mockPost,
    };
    const createCommentDto = { content: 'test' };
    const createCommentDtoWithParentId = {
      content: 'test',
      parentId: 1,
    };

    it('SUCCESS: 댓글을 정상적으로 생성한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyCommentCreateFn = jest.spyOn(mockCommentRepository, 'create');
      spyCommentCreateFn.mockReturnValueOnce(mockComment);
      const spyCommentSaveFn = jest.spyOn(mockCommentRepository, 'save');

      // When
      const result = await commentService.createComment(
        postId,
        user,
        createCommentDto,
      );

      // Then
      expect(result).toBeUndefined();
      expect(spyPostFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyPostFindOneByFn).toHaveBeenCalledWith({ id: postId });
      expect(spyCommentCreateFn).toHaveBeenCalledTimes(1);
      expect(spyCommentCreateFn).toHaveBeenCalledWith({
        content: createCommentDto.content,
        parent: null,
        user,
        post: mockPost,
      });
      expect(spyCommentSaveFn).toHaveBeenCalledTimes(1);
      expect(spyCommentSaveFn).toHaveBeenCalledWith(mockComment);
    });

    it('SUCCESS: 대댓글을 정상적으로 생성한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyCommentFindOneByFn = jest.spyOn(
        mockCommentRepository,
        'findOneBy',
      );
      spyCommentFindOneByFn.mockResolvedValueOnce(mockParentComment);
      const spyCommentCreateFn = jest.spyOn(mockCommentRepository, 'create');
      spyCommentCreateFn.mockReturnValueOnce(mockComment);
      const spyCommentSaveFn = jest.spyOn(mockCommentRepository, 'save');

      // When
      const result = await commentService.createComment(
        postId,
        user,
        createCommentDtoWithParentId,
      );

      // Then
      expect(result).toBeUndefined();
      expect(spyPostFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyPostFindOneByFn).toHaveBeenCalledWith({ id: postId });
      expect(spyCommentFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledWith({
        id: createCommentDtoWithParentId.parentId,
      });
      expect(spyCommentCreateFn).toHaveBeenCalledTimes(1);
      expect(spyCommentCreateFn).toHaveBeenCalledWith({
        content: createCommentDtoWithParentId.content,
        parent: mockParentComment,
        user,
        post: mockPost,
      });
      expect(spyCommentSaveFn).toHaveBeenCalledTimes(1);
      expect(spyCommentSaveFn).toHaveBeenCalledWith(mockComment);
    });

    it('FAILURE: 글이 존재하지 않으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await commentService.createComment(postId, user, createCommentDto);

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

    it('FAILURE: 댓글이 존재하지 않으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyCommentFindOneByFn = jest.spyOn(
        mockCommentRepository,
        'findOneBy',
      );
      spyCommentFindOneByFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await commentService.createComment(
          postId,
          user,
          createCommentDtoWithParentId,
        );

        // Then
      } catch (error) {
        hasThrown = true;
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(error.getResponse()).toEqual({
          error: 'Not Found',
          message: 'NOT_FOUND_COMMENT',
          statusCode: 404,
        });
      }
      expect(hasThrown).toBeTruthy();
    });
  });
});
