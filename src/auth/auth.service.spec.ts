import { HttpStatus, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Test, TestingModule } from '@nestjs/testing';
import * as bcrypt from 'bcrypt';
import { UserService } from '../user/user.service';
import { AuthService } from './auth.service';

describe('AuthService', () => {
  let authService: AuthService;

  const mockUserService = {
    findOneByEmail: jest.fn(),
  };
  const mockJwtService = {
    sign: jest.fn(),
    verifyAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: UserService,
          useValue: mockUserService,
        },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authService).toBeDefined();
  });

  describe('doLogin()', () => {
    const email = 'test@email';
    const password = 'test1234';
    const doLoginDto = {
      email,
      password,
    };
    const hashedPassword =
      '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO';
    const id = 1;
    const mockUser = {
      id,
      email,
      password: hashedPassword,
    };
    const mockAccessToken = 'mockAccessToken';
    const mockRefreshToken = 'mockRefreshToken';
    const mockTokenDto = {
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    };

    it('SUCCESS: 토큰을 정상적으로 발급한다.', async () => {
      // Given
      const spyUserFindOneByEmailFn = jest.spyOn(
        mockUserService,
        'findOneByEmail',
      );
      spyUserFindOneByEmailFn.mockResolvedValueOnce(mockUser);
      const spyBcryptCompareFn = jest.spyOn(bcrypt, 'compare');
      spyBcryptCompareFn.mockImplementation(() => true);
      const spyJwtServiceSignFn = jest.spyOn(mockJwtService, 'sign');
      spyJwtServiceSignFn.mockReturnValueOnce(mockAccessToken);
      spyJwtServiceSignFn.mockReturnValueOnce(mockRefreshToken);

      // When
      const result = await authService.doLogin(doLoginDto);

      // Then
      expect(result).toEqual(mockTokenDto);
      expect(spyUserFindOneByEmailFn).toHaveBeenCalledTimes(1);
      expect(spyUserFindOneByEmailFn).toHaveBeenCalledWith(email);
      expect(spyBcryptCompareFn).toHaveBeenCalledTimes(1);
      expect(spyBcryptCompareFn).toHaveBeenCalledWith(password, hashedPassword);
      expect(spyJwtServiceSignFn).toHaveBeenCalledTimes(2);
      expect(spyJwtServiceSignFn).toHaveBeenCalledWith(
        { sub: id },
        { expiresIn: '1h' },
      );
      expect(spyJwtServiceSignFn).toHaveBeenCalledWith(
        { sub: id },
        { expiresIn: '7d' },
      );
    });

    it('FAILURE: 유저를 찾을 수 없으면 Not Found Exception을 반환한다.', async () => {
      // Given
      const spyUserFindOneByEmailFn = jest.spyOn(
        mockUserService,
        'findOneByEmail',
      );
      spyUserFindOneByEmailFn.mockResolvedValueOnce(mockUser);
      const spyBcryptCompareFn = jest.spyOn(bcrypt, 'compare');
      spyBcryptCompareFn.mockImplementation(() => false);

      // When
      let hasThrown = false;
      try {
        await authService.doLogin(doLoginDto);

        // Then
      } catch (error) {
        hasThrown = true;
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.getStatus()).toEqual(HttpStatus.UNAUTHORIZED);
        expect(error.getResponse()).toEqual({
          error: 'Unauthorized',
          message: 'INVALID_PASSWORD',
          statusCode: 401,
        });
      }
      expect(hasThrown).toBeTruthy();
    });
  });

  describe('verify()', () => {
    const id = 1;
    const mockToken = 'mockToken';
    const mockClaims = { sub: id };

    it('SUCCESS: 토큰에서 정상적으로 Claims을 꺼내온다.', async () => {
      // Given
      const spyJwtServiceVerifyAsyncFn = jest.spyOn(
        mockJwtService,
        'verifyAsync',
      );
      spyJwtServiceVerifyAsyncFn.mockReturnValueOnce(mockClaims);

      // When
      const result = await authService.verifyToken(mockToken);

      // Then
      expect(result).toEqual(mockClaims);
      expect(spyJwtServiceVerifyAsyncFn).toHaveBeenCalledTimes(1);
      expect(spyJwtServiceVerifyAsyncFn).toHaveBeenCalledWith(mockToken);
    });
  });

  describe('reissueAccessToken()', () => {
    const id = 1;
    const user = {
      id: id,
      email: 'test@email',
      nickname: 'test',
      password: '$2b$10$Tuip8DXQlXtBaTVJvpvZ0eIfrxkXktGTSF4ew4HSdvWD7MRF.gykO',
    };
    const mockAccessToken = 'mockAccessToken';
    const mockTokenDto = {
      accessToken: mockAccessToken,
    };

    it('SUCCESS: 엑세스 토큰을 정상적으로 재발급한다.', async () => {
      // Given
      const spyJwtServiceSignFn = jest.spyOn(mockJwtService, 'sign');
      spyJwtServiceSignFn.mockReturnValueOnce(mockAccessToken);

      // When
      const result = await authService.reissueAccessToken(user);

      // Then
      expect(result).toEqual(mockTokenDto);
      expect(spyJwtServiceSignFn).toHaveBeenCalledTimes(1);
      expect(spyJwtServiceSignFn).toHaveBeenCalledWith(
        { sub: id },
        { expiresIn: '1h' },
      );
    });
  });
});
