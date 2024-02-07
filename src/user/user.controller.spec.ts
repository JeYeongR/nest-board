import { Test, TestingModule } from '@nestjs/testing';
import { UserController } from './user.controller';
import { UserService } from './user.service';

describe('UserController', () => {
  let userController: UserController;

  const mockUserService = {
    createUser: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    userController = module.get<UserController>(UserController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(userController).toBeDefined();
  });

  describe('createUser()', () => {
    const createDto = {
      email: 'test@email',
      nickname: 'test',
      password: 'test1234',
    };

    it('SUCCESS: 유저 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyCreateUserFn = jest.spyOn(mockUserService, 'createUser');

      const expectedResult = {
        message: 'CREATE_SUCCESS',
        statusCode: 201,
      };

      // When
      const result = await userController.createUser(createDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyCreateUserFn).toHaveBeenCalledTimes(1);
      expect(spyCreateUserFn).toHaveBeenCalledWith(createDto);
    });
  });
});
