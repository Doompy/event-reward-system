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

  it('should be defined', () => {
    expect(authController).toBeDefined();
  });

  describe('create', () => {
    it('should create a new user successfully', async () => {
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

    it('should handle errors when creating a user', async () => {
      const createUserDto: CreateUserDto = {
        email: 'existing@example.com',
        password: 'password123',
        nickname: 'existinguser',
      };

      const error = new Error('Email already exists');
      mockAuthService.create.mockRejectedValue(error);

      const result = await authController.create(createUserDto);
      expect(result).toEqual({
        success: false,
        message: 'Email already exists'
      });
      expect(authService.create).toHaveBeenCalledWith(createUserDto);
    });
  });

  describe('login', () => {
    it('should login a user successfully', async () => {
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
    it('should validate a token successfully', async () => {
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

      const result = await authController.validateToken({ token });
      expect(result).toEqual(expectedResult);
      expect(authService.validateToken).toHaveBeenCalledWith(token);
    });

    it('should return invalid for an invalid token', async () => {
      const token = 'invalid-token';
      const expectedResult = { isValid: false };

      mockAuthService.validateToken.mockResolvedValue(expectedResult);

      const result = await authController.validateToken({ token });
      expect(result).toEqual(expectedResult);
      expect(authService.validateToken).toHaveBeenCalledWith(token);
    });
  });

  describe('refreshToken', () => {
    it('should refresh tokens successfully', async () => {
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
    it('should revoke a token successfully', async () => {
      const token = 'token-to-revoke';
      const userId = 'userId123';

      const expectedResult = {
        success: true,
        message: 'Token revoked successfully',
      };

      mockAuthService.revokeToken.mockResolvedValue(expectedResult);

      const result = await authController.revokeToken({ token, userId });
      expect(result).toEqual(expectedResult);
      expect(authService.revokeToken).toHaveBeenCalledWith(token, userId);
    });
  });

  describe('updateUserRole', () => {
    it('should update user role successfully', async () => {
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
    it('should return all users', async () => {
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
    it('should return user role by email', async () => {
      const email = 'test@example.com';
      const expectedResult = {
        success: true,
        role: UserRole.USER,
      };

      mockAuthService.getUserRole.mockResolvedValue(expectedResult);

      const result = await authController.getUserRole(email);
      expect(result).toEqual(expectedResult);
      expect(authService.getUserRole).toHaveBeenCalledWith(email);
    });

    it('should handle user not found', async () => {
      const email = 'nonexistent@example.com';
      const expectedResult = {
        success: false,
        message: 'User not found',
      };

      mockAuthService.getUserRole.mockResolvedValue(expectedResult);

      const result = await authController.getUserRole(email);
      expect(result).toEqual(expectedResult);
      expect(authService.getUserRole).toHaveBeenCalledWith(email);
    });
  });
});
