import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

describe('AuthController', () => {
  let authController: AuthController;

  const mockAuthService = {
    doLogin: jest.fn(),
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
    }).compile();

    authController = module.get<AuthController>(AuthController);
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
});
