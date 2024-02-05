import {
  ConflictException,
  HttpStatus,
  NotFoundException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { User } from '../entity/user.entity';
import { UserService } from './user.service';

describe('UserService', () => {
  let userService: UserService;

  const mockUserRepository = {
    existsBy: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    findOneBy: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UserService,
        {
          provide: getRepositoryToken(User),
          useValue: mockUserRepository,
        },
      ],
    }).compile();

    userService = module.get<UserService>(UserService);
  });

  it('should be defined', () => {
    expect(userService).toBeDefined();
  });

  describe('createUser()', () => {
    const email = 'test@email';
    const password = 'test1234';
    const createDto = {
      email,
      password,
    };
    const mockHashedPassword: string =
      '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO';
    const mockUser = {
      email,
      password: mockHashedPassword,
    };

    it('SUCCESS: 유저를 정상적으로 생성한다.', async () => {
      // Given
      const spyUserExistsByFn = jest.spyOn(mockUserRepository, 'existsBy');
      spyUserExistsByFn.mockResolvedValueOnce(false);
      const spyJestHashFn = jest.spyOn(bcrypt, 'hash');
      spyJestHashFn.mockImplementation(() => mockHashedPassword);
      const spyUserCreateFn = jest.spyOn(mockUserRepository, 'create');
      spyUserCreateFn.mockReturnValueOnce(mockUser);
      const spyUserSaveFn = jest.spyOn(mockUserRepository, 'save');

      // When
      const result = await userService.createUser(createDto);

      // Then
      expect(result).toBeUndefined();
      expect(spyUserExistsByFn).toHaveBeenCalledTimes(1);
      expect(spyUserExistsByFn).toHaveBeenCalledWith({ email });
      expect(spyJestHashFn).toHaveBeenCalledTimes(1);
      expect(spyJestHashFn).toHaveBeenCalledWith(password, 10);
      expect(spyUserCreateFn).toHaveBeenCalledTimes(1);
      expect(spyUserCreateFn).toHaveBeenCalledWith(mockUser);
      expect(spyUserSaveFn).toHaveBeenCalledTimes(1);
      expect(spyUserSaveFn).toHaveBeenCalledWith(mockUser);
    });

    it('FAILURE: 이메일이 이미 존재하면 Conflict Exception을 반환한다.', async () => {
      // Given
      const spyUserExistsByFn = jest.spyOn(mockUserRepository, 'existsBy');
      spyUserExistsByFn.mockResolvedValueOnce(true);

      // When
      let hasThrown = false;
      try {
        await userService.createUser(createDto);

        // Then
      } catch (error) {
        hasThrown = true;
        expect(error).toBeInstanceOf(ConflictException);
        expect(error.getStatus()).toEqual(HttpStatus.CONFLICT);
        expect(error.getResponse()).toEqual({
          error: 'Conflict',
          message: 'EXISTS_EMAIL',
          statusCode: 409,
        });
      }
      expect(hasThrown).toBeTruthy();
    });
  });

  describe('findOneByEmail()', () => {
    const email = 'test@email';
    const mockUser = {
      email,
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };

    it('SUCCESS: 유저를 정상적으로 조회한다.', async () => {
      // Given
      const spyUserFindOneByFn = jest.spyOn(mockUserRepository, 'findOneBy');
      spyUserFindOneByFn.mockResolvedValueOnce(mockUser);

      // When
      const result = await userService.findOneByEmail(email);

      // Then
      expect(result).toEqual(mockUser);
      expect(spyUserFindOneByFn).toHaveBeenCalledTimes(1);
      expect(spyUserFindOneByFn).toHaveBeenCalledWith({ email });
    });

    it('FAILURE: 유저를 찾을 수 없으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyUserFindOneByFn = jest.spyOn(mockUserRepository, 'findOneBy');
      spyUserFindOneByFn.mockResolvedValueOnce(null);

      // When
      let hasThrown = false;
      try {
        await userService.findOneByEmail(email);

        // Then
      } catch (error) {
        hasThrown = true;
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.getStatus()).toEqual(HttpStatus.NOT_FOUND);
        expect(error.getResponse()).toEqual({
          error: 'Not Found',
          message: 'NOT_FOUND_USER',
          statusCode: 404,
        });
      }
      expect(hasThrown).toBeTruthy();
    });
  });
});
