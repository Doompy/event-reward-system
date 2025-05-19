import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';
import { UserRole } from 'libs/database/schema/user.schema';

describe('AuthController', () => {
  let authController: AuthController;
  let authService: AuthService;

  const mockAuthService = {
    create: jest.fn(),
    login: jest.fn(),
    validateToken: jest.fn(),
    refreshToken: jest.fn(),
    revokeToken: jest.fn(),
    updateUserRole: jest.fn(),
    findAllUsers: jest.fn(),
    getUserRole: jest.fn(),
  };

  // 간단한 컨텍스트 모킹
  const mockTcpContext: any = {
    getPattern: jest.fn().mockReturnValue('validate_token'),
  };

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    authController = app.get<AuthController>(AuthController);
    authService = app.get<AuthService>(AuthService);
  });

  it('컨트롤러가 정의되어야 함', () => {
    expect(authController).toBeDefined();
  });

  describe('create', () => {
    it('새 사용자를 성공적으로 생성해야 함', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testuser',
      };

      const mockUser = {
        _id: 'userId123',
        email: createUserDto.email,
        nickname: createUserDto.nickname,
        role: UserRole.USER,
        password: 'hashedPassword',
        toObject: jest.fn().mockReturnValue({
          _id: 'userId123',
          email: createUserDto.email,
          nickname: createUserDto.nickname,
          role: UserRole.USER,
          password: 'hashedPassword',
        }),
      };

      const expectedResult = {
        success: true,
        data: {
          _id: 'userId123',
          email: createUserDto.email,
          nickname: createUserDto.nickname,
          role: UserRole.USER,
        }
      };

      mockAuthService.create.mockResolvedValue(mockUser);

      const result = await authController.create(createUserDto);
      expect(result).toEqual(expectedResult);
      expect(authService.create).toHaveBeenCalledWith(createUserDto);
    });

    it('사용자 생성 시 오류를 처리해야 함', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        nickname: 'existinguser',
      };

      const error = new Error('이메일이 이미 존재합니다');
      mockAuthService.create.mockRejectedValue(error);

      const result = await authController.create(createUserDto);
      expect(result).toEqual({
        success: false,
        message: '이메일이 이미 존재합니다'
      });
      expect(authService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('사용자 로그인이 성공적으로 이루어져야 함', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };
      const ipAddress = '127.0.0.1';
      const userAgent = 'Chrome';

      const expectedResult = {
        success: true,
        user: {
          _id: 'userId123',
          email: loginDto.email,
          nickname: 'testuser',
          role: UserRole.USER,
        },
        access_token: 'access-token',
        refresh_token: 'refresh-token',
      };

      mockAuthService.login.mockResolvedValue(expectedResult);

      const result = await authController.login({ 
        loginDto, 
        ipAddress, 
        userAgent 
      });

      expect(result).toEqual(expectedResult);
      expect(authService.login).toHaveBeenCalledWith(loginDto, ipAddress, userAgent);
    });
  });

  describe('validateToken', () => {
    it('토큰이 유효할 때 성공적으로 검증해야 함', async () => {
      const token = 'valid-token';
      const expectedResult = {
        isValid: true,
        user: {
          _id: 'userId123',
          email: 'test@example.com',
          nickname: 'testuser',
          role: UserRole.USER,
        }
      };

      mockAuthService.validateToken.mockResolvedValue(expectedResult);

      const result = await authController.validateToken({ token }, mockTcpContext);
      expect(result).toEqual(expectedResult);
      expect(authService.validateToken).toHaveBeenCalledWith(token);
    });

    it('유효하지 않은 토큰에 대해 invalid를 반환해야 함', async () => {
      const token = 'invalid-token';
      const expectedResult = { isValid: false };

      mockAuthService.validateToken.mockResolvedValue(expectedResult);

      const result = await authController.validateToken({ token }, mockTcpContext);
      expect(result).toEqual(expectedResult);
      expect(authService.validateToken).toHaveBeenCalledWith(token);
    });
  });

  describe('refreshToken', () => {
    it('토큰 갱신이 성공적으로 이루어져야 함', async () => {
      const refreshToken = 'valid-refresh-token';
      const ipAddress = '127.0.0.1';
      const userAgent = 'Chrome';

      const expectedResult = {
        success: true,
        user: {
          _id: 'userId123',
          email: 'test@example.com',
          nickname: 'testuser',
          role: UserRole.USER,
        },
        access_token: 'new-access-token',
        refresh_token: 'new-refresh-token',
      };

      mockAuthService.refreshToken.mockResolvedValue(expectedResult);

      const result = await authController.refreshToken({ 
        refreshToken, 
        ipAddress, 
        userAgent 
      });

      expect(result).toEqual(expectedResult);
      expect(authService.refreshToken).toHaveBeenCalledWith(refreshToken, ipAddress, userAgent);
    });
  });

  describe('revokeToken', () => {
    it('토큰 취소가 성공적으로 이루어져야 함', async () => {
      const token = 'token-to-revoke';
      const userId = 'userId123';

      const expectedResult = {
        success: true,
        message: '토큰이 성공적으로 취소되었습니다',
      };

      mockAuthService.revokeToken.mockResolvedValue(expectedResult);

      const result = await authController.revokeToken({ token, userId });
      expect(result).toEqual(expectedResult);
      expect(authService.revokeToken).toHaveBeenCalledWith(token, userId);
    });
  });

  describe('updateUserRole', () => {
    it('사용자 역할이 성공적으로 업데이트되어야 함', async () => {
      const updateData: UpdateUserRoleDto = {
        email: 'user@example.com',
        role: UserRole.OPERATOR,
      };
      const adminId = 'adminId123';

      const expectedResult = {
        success: true,
        user: {
          _id: 'userId123',
          email: 'user@example.com',
          nickname: 'user',
          role: UserRole.OPERATOR,
        }
      };

      mockAuthService.updateUserRole.mockResolvedValue(expectedResult);

      const result = await authController.updateUserRole({ updateData, adminId });
      expect(result).toEqual(expectedResult);
      expect(authService.updateUserRole).toHaveBeenCalledWith(updateData, adminId);
    });
  });

  describe('findAllUsers', () => {
    it('모든 사용자를 반환해야 함', async () => {
      const expectedResult = {
        success: true,
        users: [
          {
            _id: 'userId123',
            email: 'user1@example.com',
            nickname: 'user1',
            role: UserRole.USER,
          },
          {
            _id: 'userId456',
            email: 'user2@example.com',
            nickname: 'user2',
            role: UserRole.OPERATOR,
          },
        ]
      };

      mockAuthService.findAllUsers.mockResolvedValue(expectedResult);

      const result = await authController.findAllUsers();
      expect(result).toEqual(expectedResult);
      expect(authService.findAllUsers).toHaveBeenCalled();
    });
  });

  describe('getUserRole', () => {
    it('사용자 역할을 반환해야 함', async () => {
      const email = 'user@example.com';
      const expectedResult = {
        success: true,
        role: UserRole.USER,
      };

      mockAuthService.getUserRole.mockResolvedValue(expectedResult);

      const result = await authController.getUserRole(email);
      expect(result).toEqual(expectedResult);
      expect(authService.getUserRole).toHaveBeenCalledWith(email);
    });
  });
});
