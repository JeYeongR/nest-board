import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { RefreshTokenAuthGuard } from './guard/refresh-token-auth.guard';

describe('AuthController', () => {
  let authController: AuthController;

  const mockAuthService = {
    doLogin: jest.fn(),
    reissueAccessToken: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    })
      .overrideGuard(RefreshTokenAuthGuard)
      .useValue({
        canActivate: () => true,
      })
      .compile();

    authController = module.get<AuthController>(AuthController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('doLogin()', () => {
    const mockAccessToken = 'mockAccessToken';
    const mockRefreshToken = 'mockRefreshToken';
    const mockTokenDto = {
      accessToken: mockAccessToken,
      refreshToken: mockRefreshToken,
    };
    const doLoginDto = {
      email: 'test@email',
      password: 'test1234',
    };

    it('SUCCESS: Auth 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyDoLoginFn = jest.spyOn(mockAuthService, 'doLogin');
      spyDoLoginFn.mockResolvedValue(mockTokenDto);

      const expectedResult = {
        message: 'LOGIN_SUCCESS',
        statusCode: 200,
        data: mockTokenDto,
      };

      // When
      const result = await authController.doLogin(doLoginDto);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyDoLoginFn).toHaveBeenCalledTimes(1);
      expect(spyDoLoginFn).toHaveBeenCalledWith(doLoginDto);
    });
  });

  describe('reissueAccessToken()', () => {
    const mockAccessToken = 'mockAccessToken';
    const mockTokenDto = {
      accessToken: mockAccessToken,
    };
    const user = {
      id: 1,
      email: 'test@email',
      nickname: 'test',
      password: 'test1234',
    };

    it('SUCCESS: Auth 서비스를 정상적으로 호출한다.', async () => {
      // Given
      const spyReissueAccessTokenFn = jest.spyOn(
        mockAuthService,
        'reissueAccessToken',
      );
      spyReissueAccessTokenFn.mockResolvedValue(mockTokenDto);

      const expectedResult = {
        message: 'REISSUE_SUCCESS',
        statusCode: 200,
        data: mockTokenDto,
      };

      // When
      const result = await authController.reissueAccessToken(user);

      // Then
      expect(result).toEqual(expectedResult);
      expect(spyReissueAccessTokenFn).toHaveBeenCalledTimes(1);
      expect(spyReissueAccessTokenFn).toHaveBeenCalledWith(user);
    });
  });
});
