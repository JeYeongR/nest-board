import {
  BadRequestException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { Comment } from '../entity/comment.entity';
import { Post } from '../entity/post.entity';
import { CommentService } from './comment.service';

describe('CommentService', () => {
  let commentService: CommentService;

  const mockCommentRepository = {
    findOneBy: jest.fn(),
    create: jest.fn(),
    maximum: jest.fn(),
    sum: jest.fn(),
    findAndCount: jest.fn(),
    save: jest.fn(),
  };
  const mockPostRepository = {
    findOneBy: jest.fn(),
  };
  const mockEntityManager = {
    save: jest.fn(),
    delete: jest.fn(),
    createQueryBuilder: jest.fn(() => ({
      update: jest.fn().mockReturnThis(),
      delete: jest.fn().mockReturnThis(),
      from: jest.fn().mockReturnThis(),
      set: jest.fn().mockReturnThis(),
      where: jest.fn().mockReturnThis(),
      andWhere: jest.fn().mockReturnThis(),
      execute: jest.fn(),
    })),
  };
  const mockDataSource = {
    transaction: jest.fn((cb) => cb(mockEntityManager)),
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
        {
          provide: DataSource,
          useValue: mockDataSource,
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
    const maxGroup = 1;
    const mockParentComment = {
      id: 1,
      content: 'test',
      depth: 1,
      sequence: 1,
      group: maxGroup + 1,
      childrenNum: 0,
    };
    const mockComment = {
      content: 'test',
      group: maxGroup + 1,
      user,
      post: mockPost,
    };
    const createCommentDto = { content: 'test' };
    const createCommentDtoWithParentId = {
      content: 'test',
      parentId: 1,
    };
    const mockChildrenNumSum = 0;

    it('SUCCESS: 댓글을 정상적으로 생성한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyCommentCreateFn = jest.spyOn(mockCommentRepository, 'create');
      spyCommentCreateFn.mockReturnValueOnce(mockComment);
      const spyCommentMaximumFn = jest.spyOn(mockCommentRepository, 'maximum');
      spyCommentMaximumFn.mockResolvedValueOnce(maxGroup);
      const spyDataSourceTransactionFn = jest.spyOn(
        mockDataSource,
        'transaction',
      );
      const spyEntityManagerSaveFn = jest.spyOn(mockEntityManager, 'save');

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
        group: maxGroup + 1,
        post: mockPost,
        user,
      });
      expect(spyCommentMaximumFn).toHaveBeenCalledTimes(1);
      expect(spyCommentMaximumFn).toHaveBeenCalledWith('group', {
        post: { id: postId },
      });
      expect(spyDataSourceTransactionFn).toHaveBeenCalledTimes(1);
      expect(spyEntityManagerSaveFn).toHaveBeenCalledTimes(1);
      expect(spyEntityManagerSaveFn).toHaveBeenCalledWith(mockComment);
    });

    it('SUCCESS: depth < maxDepth에 대댓글을 정상적으로 생성한다.', async () => {
      // Given
      const mockMaxDepth = 3;
      const resultSequence =
        mockChildrenNumSum + mockParentComment.sequence + 1;
      const mockReplyComment = {
        content: 'test',
        group: maxGroup + 1,
        sequence: resultSequence,
        depth: mockParentComment.depth + 1,
        user,
        post: mockPost,
      };
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyDataSourceTransactionFn = jest.spyOn(
        mockDataSource,
        'transaction',
      );
      const spyCommentFindOneByFn = jest.spyOn(
        mockCommentRepository,
        'findOneBy',
      );
      spyCommentFindOneByFn.mockResolvedValueOnce(mockParentComment);
      const spyCommentSumFn = jest.spyOn(mockCommentRepository, 'sum');
      spyCommentSumFn.mockResolvedValueOnce(mockChildrenNumSum);
      const spyCommentMaximumFn = jest.spyOn(mockCommentRepository, 'maximum');
      spyCommentMaximumFn.mockResolvedValueOnce(mockMaxDepth);
      const spyCommentCreateFn = jest.spyOn(mockCommentRepository, 'create');
      spyCommentCreateFn.mockReturnValueOnce(mockReplyComment);
      const spyEntityManagerSaveFn = jest.spyOn(mockEntityManager, 'save');

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
      expect(spyDataSourceTransactionFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledWith({
        id: createCommentDtoWithParentId.parentId,
      });
      expect(spyCommentSumFn).toHaveBeenCalledTimes(1);
      expect(spyCommentSumFn).toHaveBeenCalledWith('childrenNum', {
        group: mockParentComment.group,
      });
      expect(spyCommentMaximumFn).toHaveBeenCalledTimes(1);
      expect(spyCommentMaximumFn).toHaveBeenCalledWith('depth', {
        group: mockParentComment.group,
      });
      expect(spyCommentCreateFn).toHaveBeenCalledTimes(1);
      expect(spyCommentCreateFn).toHaveBeenCalledWith({
        content: createCommentDtoWithParentId.content,
        group: mockParentComment.group,
        sequence: resultSequence,
        depth: mockParentComment.depth + 1,
        user,
        post: mockPost,
      });
      expect(spyEntityManagerSaveFn).toHaveBeenCalledTimes(2);
      expect(spyEntityManagerSaveFn).toHaveBeenCalledWith(mockParentComment);
      expect(spyEntityManagerSaveFn).toHaveBeenCalledWith(mockReplyComment);
    });

    it('SUCCESS: depth == maxDepth 대댓글을 정상적으로 생성한다.', async () => {
      // Given
      const mockMaxDepth = 2;
      const resultSequence =
        mockChildrenNumSum +
        mockParentComment.sequence +
        1 +
        mockParentComment.childrenNum;
      const mockReplyComment = {
        content: 'test',
        group: maxGroup + 1,
        sequence: resultSequence,
        depth: mockParentComment.depth + 1,
        user,
        post: mockPost,
      };
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyDataSourceTransactionFn = jest.spyOn(
        mockDataSource,
        'transaction',
      );
      const spyCommentFindOneByFn = jest.spyOn(
        mockCommentRepository,
        'findOneBy',
      );
      spyCommentFindOneByFn.mockResolvedValueOnce(mockParentComment);
      const spyCommentSumFn = jest.spyOn(mockCommentRepository, 'sum');
      spyCommentSumFn.mockResolvedValueOnce(mockChildrenNumSum);
      const spyCommentMaximumFn = jest.spyOn(mockCommentRepository, 'maximum');
      spyCommentMaximumFn.mockResolvedValueOnce(mockMaxDepth);
      const qb = mockEntityManager.createQueryBuilder();
      const spyEntityManagerQbFn = jest.spyOn(
        mockEntityManager,
        'createQueryBuilder',
      );
      spyEntityManagerQbFn.mockReturnValueOnce(qb);
      const spyUpdateFn = jest.spyOn(qb, 'update');
      const spySetFn = jest.spyOn(qb, 'set');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyAndWhereFn = jest.spyOn(qb, 'andWhere');
      const spyExecuteFn = jest.spyOn(qb, 'execute');
      const spyCommentCreateFn = jest.spyOn(mockCommentRepository, 'create');
      spyCommentCreateFn.mockReturnValueOnce(mockReplyComment);
      const spyEntityManagerSaveFn = jest.spyOn(mockEntityManager, 'save');

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
      expect(spyDataSourceTransactionFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledWith({
        id: createCommentDtoWithParentId.parentId,
      });
      expect(spyCommentSumFn).toHaveBeenCalledTimes(1);
      expect(spyCommentSumFn).toHaveBeenCalledWith('childrenNum', {
        group: mockParentComment.group,
      });
      expect(spyCommentMaximumFn).toHaveBeenCalledTimes(1);
      expect(spyCommentMaximumFn).toHaveBeenCalledWith('depth', {
        group: mockParentComment.group,
      });
      expect(spyEntityManagerQbFn).toHaveBeenCalledTimes(2);
      expect(spyEntityManagerQbFn).toHaveBeenCalledWith();
      expect(spyUpdateFn).toHaveBeenCalledTimes(1);
      expect(spyUpdateFn).toHaveBeenCalledWith(Comment);
      expect(spySetFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledWith('group = :group', {
        group: mockParentComment.group,
      });
      expect(spyAndWhereFn).toHaveBeenCalledTimes(1);
      expect(spyExecuteFn).toHaveBeenCalledTimes(1);
      expect(spyCommentCreateFn).toHaveBeenCalledTimes(1);
      expect(spyCommentCreateFn).toHaveBeenCalledWith({
        content: createCommentDtoWithParentId.content,
        group: mockParentComment.group,
        sequence: resultSequence,
        depth: mockParentComment.depth + 1,
        user,
        post: mockPost,
      });
      expect(spyEntityManagerSaveFn).toHaveBeenCalledTimes(2);
      expect(spyEntityManagerSaveFn).toHaveBeenCalledWith(mockParentComment);
      expect(spyEntityManagerSaveFn).toHaveBeenCalledWith(mockReplyComment);
    });

    it('SUCCESS: depth > maxDepth 대댓글을 정상적으로 생성한다.', async () => {
      // Given
      const mockMaxDepth = 1;
      const resultSequence = mockParentComment.sequence + 1;
      const mockReplyComment = {
        content: 'test',
        group: maxGroup + 1,
        sequence: resultSequence,
        depth: mockParentComment.depth + 1,
        user,
        post: mockPost,
      };
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyDataSourceTransactionFn = jest.spyOn(
        mockDataSource,
        'transaction',
      );
      const spyCommentFindOneByFn = jest.spyOn(
        mockCommentRepository,
        'findOneBy',
      );
      spyCommentFindOneByFn.mockResolvedValueOnce(mockParentComment);
      const spyCommentSumFn = jest.spyOn(mockCommentRepository, 'sum');
      spyCommentSumFn.mockResolvedValueOnce(mockChildrenNumSum);
      const spyCommentMaximumFn = jest.spyOn(mockCommentRepository, 'maximum');
      spyCommentMaximumFn.mockResolvedValueOnce(mockMaxDepth);
      const qb = mockEntityManager.createQueryBuilder();
      const spyEntityManagerQbFn = jest.spyOn(
        mockEntityManager,
        'createQueryBuilder',
      );
      spyEntityManagerQbFn.mockReturnValueOnce(qb);
      const spyUpdateFn = jest.spyOn(qb, 'update');
      const spySetFn = jest.spyOn(qb, 'set');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyAndWhereFn = jest.spyOn(qb, 'andWhere');
      const spyExecuteFn = jest.spyOn(qb, 'execute');
      const spyCommentCreateFn = jest.spyOn(mockCommentRepository, 'create');
      spyCommentCreateFn.mockReturnValueOnce(mockReplyComment);
      const spyEntityManagerSaveFn = jest.spyOn(mockEntityManager, 'save');

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
      expect(spyDataSourceTransactionFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledWith({
        id: createCommentDtoWithParentId.parentId,
      });
      expect(spyCommentSumFn).toHaveBeenCalledTimes(1);
      expect(spyCommentSumFn).toHaveBeenCalledWith('childrenNum', {
        group: mockParentComment.group,
      });
      expect(spyCommentMaximumFn).toHaveBeenCalledTimes(1);
      expect(spyCommentMaximumFn).toHaveBeenCalledWith('depth', {
        group: mockParentComment.group,
      });
      expect(spyEntityManagerQbFn).toHaveBeenCalledTimes(2);
      expect(spyEntityManagerQbFn).toHaveBeenCalledWith();
      expect(spyUpdateFn).toHaveBeenCalledTimes(1);
      expect(spyUpdateFn).toHaveBeenCalledWith(Comment);
      expect(spySetFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledTimes(1);
      expect(spyWhereFn).toHaveBeenCalledWith('group = :group', {
        group: mockParentComment.group,
      });
      expect(spyAndWhereFn).toHaveBeenCalledTimes(1);
      expect(spyExecuteFn).toHaveBeenCalledTimes(1);
      expect(spyCommentCreateFn).toHaveBeenCalledTimes(1);
      expect(spyCommentCreateFn).toHaveBeenCalledWith({
        content: createCommentDtoWithParentId.content,
        group: mockParentComment.group,
        sequence: resultSequence,
        depth: mockParentComment.depth + 1,
        user,
        post: mockPost,
      });
      expect(spyEntityManagerSaveFn).toHaveBeenCalledTimes(2);
      expect(spyEntityManagerSaveFn).toHaveBeenCalledWith(mockParentComment);
      expect(spyEntityManagerSaveFn).toHaveBeenCalledWith(mockReplyComment);
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

  describe('getComments()', () => {
    const postId = 1;
    const userId = 1;
    const pageRequestDto = {
      pageNo: 1,
      getOffset: function (): number {
        return 0;
      },
      getLimit: function (): number {
        return 10;
      },
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
    const mockComments = [
      {
        id: 1,
        sequence: 1,
        content: 'test',
        group: 1,
        depth: 1,
        user: {
          id: userId,
          nickname: 'test',
        },
        isMyComment: true,
      },
    ];
    const mockCommentsCount = 1;

    it('SUCCESS: 댓글을 정상적으로 조회한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyCommentFindAndCountFn = jest.spyOn(
        mockCommentRepository,
        'findAndCount',
      );
      spyCommentFindAndCountFn.mockResolvedValueOnce([
        mockComments,
        mockCommentsCount,
      ]);

      const expectedResult = {
        currentPage: pageRequestDto.pageNo,
        items: mockComments,
        pageSize: pageRequestDto.getLimit(),
        totalCount: mockCommentsCount,
        totalPage: Math.ceil(mockCommentsCount / pageRequestDto.getLimit()),
      };

      // When
      const result = await commentService.getComments(
        postId,
        pageRequestDto,
        userId,
      );

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyPostFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyPostFindOneByFn).toHaveBeenCalledWith({ id: postId });
      expect(spyCommentFindAndCountFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindAndCountFn).toHaveBeenCalledWith({
        where: {
          post: { id: postId },
        },
        relations: { user: true },
        order: {
          group: 'ASC',
          sequence: 'ASC',
        },
        take: pageRequestDto.getLimit(),
        skip: pageRequestDto.getOffset(),
      });
    });

    it('FAILURE: 글이 존재하지 않으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await commentService.getComments(postId, pageRequestDto, userId);

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

    it('FAILURE: 최대 페이지를 넘어가면 Bad Request Exception을 반환한다.', async () => {
      // Given
      const pageRequestDto = {
        pageNo: 2,
        getOffset: function (): number {
          return 0;
        },
        getLimit: function (): number {
          return 10;
        },
      };
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyCommentFindAndCountFn = jest.spyOn(
        mockCommentRepository,
        'findAndCount',
      );
      spyCommentFindAndCountFn.mockReturnValueOnce([
        mockComments,
        mockCommentsCount,
      ]);

      // When
      let hasThrown = false;
      try {
        await commentService.getComments(postId, pageRequestDto, userId);

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

  describe('updateComment()', () => {
    const postId = 1;
    const userId = 1;
    const commentId = 1;
    const updateCommentDto = { content: 'test2' };
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
    const mockComment = {
      id: 1,
      sequence: 1,
      content: 'test',
      group: 1,
      depth: 1,
      user: {
        id: userId,
        nickname: 'test',
      },
      isMyComment: true,
    };

    it('SUCCESS: 댓글을 정상적으로 수정한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyCommentFindOneByFn = jest.spyOn(
        mockCommentRepository,
        'findOneBy',
      );
      spyCommentFindOneByFn.mockResolvedValueOnce(mockComment);
      const spyCommentSaveFn = jest.spyOn(mockCommentRepository, 'save');

      // When
      const result = await commentService.updateComment(
        postId,
        commentId,
        userId,
        updateCommentDto,
      );

      // Then
      expect(result).toBeUndefined();
      expect(spyPostFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyPostFindOneByFn).toHaveBeenCalledWith({ id: postId });
      expect(spyCommentFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledWith({
        post: { id: postId },
        user: { id: userId },
        id: commentId,
      });
      expect(spyCommentSaveFn).toHaveBeenCalledTimes(1);
      expect(spyCommentSaveFn).toHaveBeenCalledWith({
        ...mockComment,
        content: updateCommentDto.content,
      });
    });

    it('FAILURE: 글이 존재하지 않으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await commentService.updateComment(
          postId,
          commentId,
          userId,
          updateCommentDto,
        );

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
        await commentService.updateComment(
          postId,
          commentId,
          userId,
          updateCommentDto,
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

  describe('deleteComment()', () => {
    const postId = 1;
    const userId = 1;
    const commentId = 1;
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
    const mockComment = {
      id: 1,
      sequence: 1,
      content: 'test',
      group: 1,
      depth: 1,
      childrenNum: 1,
      user: {
        id: userId,
        nickname: 'test',
      },
      isMyComment: true,
    };

    it('SUCCESS: 댓글을 정상적으로 삭제한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(mockPost);
      const spyCommentFindOneByFn = jest.spyOn(
        mockCommentRepository,
        'findOneBy',
      );
      spyCommentFindOneByFn.mockResolvedValueOnce(mockComment);
      const spyEntityManagerQbFn = jest.spyOn(
        mockEntityManager,
        'createQueryBuilder',
      );
      const qb = mockEntityManager.createQueryBuilder();
      spyEntityManagerQbFn.mockReturnValue(qb);
      const spyDeleteFn = jest.spyOn(qb, 'delete');
      const spyFromFn = jest.spyOn(qb, 'from');
      const spyWhereFn = jest.spyOn(qb, 'where');
      const spyAndWhereFn = jest.spyOn(qb, 'andWhere');
      const spyExecuteFn = jest.spyOn(qb, 'execute');
      const spyUpdateFn = jest.spyOn(qb, 'update');
      const spySetFn = jest.spyOn(qb, 'set');

      // When
      const result = await commentService.deleteComment(
        postId,
        commentId,
        userId,
      );

      // Then
      expect(result).toBeUndefined();
      expect(spyPostFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyPostFindOneByFn).toHaveBeenCalledWith({ id: postId });
      expect(spyCommentFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyCommentFindOneByFn).toHaveBeenCalledWith({
        post: { id: postId },
        user: { id: userId },
        id: commentId,
      });
      expect(spyEntityManagerQbFn).toHaveBeenCalledTimes(3);
      expect(spyDeleteFn).toHaveBeenCalledTimes(1);
      expect(spyDeleteFn).toHaveBeenCalledWith();
      expect(spyFromFn).toHaveBeenCalledTimes(1);
      expect(spyFromFn).toHaveBeenCalledWith(Comment);
      expect(spyWhereFn).toHaveBeenCalledTimes(2);
      expect(spyWhereFn).toHaveBeenCalledWith('sequence > :minSequence', {
        minSequence: mockComment.sequence - 1,
      });
      expect(spyWhereFn).toHaveBeenCalledWith('group = :group', {
        group: mockComment.group,
      });
      expect(spyAndWhereFn).toHaveBeenCalledTimes(3);
      expect(spyAndWhereFn).toHaveBeenCalledWith('sequence < :maxSequence', {
        maxSequence: mockComment.sequence + mockComment.childrenNum + 1,
      });
      expect(spyAndWhereFn).toHaveBeenCalledWith('group = :group', {
        group: mockComment.group,
      });
      expect(spyAndWhereFn).toHaveBeenCalledWith('sequence > :sequence', {
        sequence: mockComment.sequence,
      });
      expect(spyExecuteFn).toHaveBeenCalledTimes(2);
      expect(spyUpdateFn).toHaveBeenCalledTimes(1);
      expect(spyUpdateFn).toHaveBeenCalledWith(Comment);
      expect(spySetFn).toHaveBeenCalledTimes(1);
    });

    it('FAILURE: 글이 존재하지 않으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyPostFindOneByFn = jest.spyOn(mockPostRepository, 'findOneBy');
      spyPostFindOneByFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await commentService.deleteComment(postId, commentId, userId);

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
        await commentService.deleteComment(postId, commentId, userId);

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
