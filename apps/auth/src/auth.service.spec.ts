import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { getModelToken } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from 'libs/database/schema/user.schema';
import { RefreshToken } from 'libs/database/schema/refresh-token.schema';
import { Model, Types } from 'mongoose';
import * as bcrypt from 'bcrypt';
import { ConflictException, ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { CreateUserDto } from './dto/create-user.dto';
import { LoginDto } from './dto/login.dto';
import { UpdateUserRoleDto } from './dto/update-user-role.dto';

jest.mock('bcrypt');

describe('AuthService', () => {
  let service: AuthService;
  let userModel: Model<User>;
  let refreshTokenModel: Model<RefreshToken>;
  let jwtService: JwtService;

  // 테스트 데이터
  const mockUser = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439011'),
    email: 'test@example.com',
    password: 'hashedPassword',
    nickname: 'testuser',
    role: UserRole.USER,
    save: jest.fn(),
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439011',
      email: 'test@example.com',
      nickname: 'testuser',
      role: UserRole.USER,
    }),
  };

  const mockAdminUser = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439012'),
    email: 'admin@example.com',
    password: 'hashedPassword',
    nickname: 'adminuser',
    role: UserRole.ADMIN,
    toObject: jest.fn().mockReturnValue({
      _id: '507f1f77bcf86cd799439012',
      email: 'admin@example.com',
      nickname: 'adminuser',
      role: UserRole.ADMIN,
    }),
  };

  const mockRefreshToken = {
    _id: new Types.ObjectId('507f1f77bcf86cd799439013'),
    token: 'refreshToken123',
    userId: mockUser._id,
    expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
    createdByIp: '127.0.0.1',
    save: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken(User.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockUser),
            constructor: jest.fn().mockResolvedValue(mockUser),
            findOne: jest.fn(),
            findById: jest.fn(),
            create: jest.fn(),
            find: jest.fn(),
            findByIdAndUpdate: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: getModelToken(RefreshToken.name),
          useValue: {
            new: jest.fn().mockResolvedValue(mockRefreshToken),
            constructor: jest.fn().mockResolvedValue(mockRefreshToken),
            findOne: jest.fn(),
            deleteMany: jest.fn(),
            deleteOne: jest.fn(),
            exec: jest.fn(),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn(),
            verify: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userModel = module.get<Model<User>>(getModelToken(User.name));
    refreshTokenModel = module.get<Model<RefreshToken>>(getModelToken(RefreshToken.name));
    jwtService = module.get<JwtService>(JwtService);
  });

  it('서비스가 정의되어야 함', () => {
    expect(service).toBeDefined();
  });

  describe('create', () => {
    it('새 사용자를 생성해야 함', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'password123',
        nickname: 'newuser',
      };

      jest.spyOn(userModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      jest.spyOn(bcrypt, 'hash').mockImplementation(() => 'hashedPassword');

      const mockNewUser = {
        ...createUserDto,
        _id: new Types.ObjectId('507f1f77bcf86cd799439014'),
        password: 'hashedPassword',
        role: UserRole.USER,
        toObject: jest.fn().mockReturnValue({
          _id: '507f1f77bcf86cd799439014',
          email: createUserDto.email,
          nickname: createUserDto.nickname,
          role: UserRole.USER,
        }),
      };

      jest.spyOn(userModel, 'create').mockImplementationOnce(() =>
        Promise.resolve(mockNewUser as any),
      );

      const result = await service.create(createUserDto);
      expect(result).toBeDefined();
      expect(result.email).toBe(createUserDto.email);
      expect(result.nickname).toBe(createUserDto.nickname);
      expect(result.role).toBe(UserRole.USER);
      expect(userModel.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
      expect(bcrypt.hash).toHaveBeenCalledWith(createUserDto.password, 10);
      expect(userModel.create).toHaveBeenCalled();
    });

    it('이미 존재하는 이메일이면 ConflictException을 발생시켜야 함', async () => {
      const createUserDto: CreateUserDto = {
        email: 'test@example.com',
        password: 'password123',
        nickname: 'testuser',
      };

      jest.spyOn(userModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      await expect(service.create(createUserDto)).rejects.toThrow(ConflictException);
      expect(userModel.findOne).toHaveBeenCalledWith({ email: createUserDto.email });
    });
  });

  describe('login', () => {
    it('올바른 인증 정보로 성공적으로 로그인해야 함', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'password123',
      };

      jest.spyOn(userModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));

      jest.spyOn(jwtService, 'sign').mockImplementation(() => 'jwt_token');

      jest.spyOn(service as any, 'generateRefreshToken').mockResolvedValueOnce('refresh_token');

      const result = await service.login(loginDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.access_token).toBe('jwt_token');
      expect(result.refresh_token).toBe('refresh_token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe(mockUser.email);
      expect(userModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
      expect(jwtService.sign).toHaveBeenCalled();
    });

    it('사용자를 찾을 수 없을 때 UnauthorizedException을 발생시켜야 함', async () => {
      const loginDto: LoginDto = {
        email: 'nonexistent@example.com',
        password: 'password123',
      };

      jest.spyOn(userModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      try {
        await service.login(loginDto);
        fail('예외가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid email');
      }
      
      expect(userModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
    });

    it('비밀번호가 일치하지 않을 때 UnauthorizedException을 발생시켜야 함', async () => {
      const loginDto: LoginDto = {
        email: 'test@example.com',
        password: 'wrongpassword',
      };

      jest.spyOn(userModel, 'findOne').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));

      try {
        await service.login(loginDto);
        fail('예외가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(UnauthorizedException);
        expect(error.message).toBe('Invalid password');
      }
      
      expect(userModel.findOne).toHaveBeenCalledWith({ email: loginDto.email });
      expect(bcrypt.compare).toHaveBeenCalledWith(loginDto.password, mockUser.password);
    });
  });

  describe('validateToken', () => {
    it('유효한 토큰을 검증해야 함', async () => {
      const token = 'valid_token';
      const decoded = { sub: mockUser._id.toString(), email: mockUser.email };

      jest.spyOn(jwtService, 'verify').mockReturnValueOnce(decoded);

      jest.spyOn(userModel, 'findById').mockReturnValue({
        exec: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      const result = await service.validateToken(token);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user._id).toBe(mockUser._id.toString());
      expect(result.user.email).toBe(mockUser.email);
      expect(jwtService.verify).toHaveBeenCalledWith(token);
      expect(userModel.findById).toHaveBeenCalledWith(decoded.sub);
    });

    it('토큰이 유효하지 않을 때 isValid가 false여야 함', async () => {
      const token = 'invalid_token';

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });

      const result = await service.validateToken(token);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(false);
      expect(jwtService.verify).toHaveBeenCalledWith(token);
    });
  });

  describe('updateUserRole', () => {
    it('관리자가 사용자 역할을 업데이트할 수 있어야 함', async () => {
      const updateUserRoleDto: UpdateUserRoleDto = {
        email: 'test@example.com',
        role: UserRole.OPERATOR,
      };
      const adminId = mockAdminUser._id.toString();

      // 관리자 찾기
      jest.spyOn(userModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockAdminUser),
      } as any);

      // 업데이트할 사용자 찾기
      const mockUpdatedUser = {
        ...mockUser,
        role: UserRole.OPERATOR,
        save: jest.fn().mockResolvedValueOnce(undefined),
        toObject: jest.fn().mockReturnValue({
          _id: mockUser._id.toString(),
          email: mockUser.email,
          nickname: mockUser.nickname,
          role: UserRole.OPERATOR,
        }),
      };

      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUpdatedUser),
      } as any);

      const result = await service.updateUserRole(updateUserRoleDto, adminId);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.user).toBeDefined();
      expect(result.user.role).toBe(UserRole.OPERATOR);
      expect(userModel.findById).toHaveBeenCalledWith(adminId);
      expect(userModel.findOne).toHaveBeenCalledWith({ email: updateUserRoleDto.email });
    });

    it('관리자가 아닌 사용자가 역할을 업데이트하려 할 때 ForbiddenException을 발생시켜야 함', async () => {
      const updateUserRoleDto: UpdateUserRoleDto = {
        email: 'test@example.com',
        role: UserRole.OPERATOR,
      };
      const userId = mockUser._id.toString();

      // 일반 사용자 찾기
      jest.spyOn(userModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockUser),
      } as any);

      try {
        await service.updateUserRole(updateUserRoleDto, userId);
        fail('예외가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(ForbiddenException);
        expect(error.message).toBe('Only admins can update user roles');
      }
      
      expect(userModel.findById).toHaveBeenCalledWith(userId);
    });

    it('존재하지 않는 사용자의 역할을 업데이트하려 할 때 NotFoundException을 발생시켜야 함', async () => {
      const updateUserRoleDto: UpdateUserRoleDto = {
        email: 'nonexistent@example.com',
        role: UserRole.OPERATOR,
      };
      const adminId = mockAdminUser._id.toString();

      // 관리자 찾기
      jest.spyOn(userModel, 'findById').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(mockAdminUser),
      } as any);

      // 존재하지 않는 사용자 찾기
      jest.spyOn(userModel, 'findOne').mockReturnValueOnce({
        exec: jest.fn().mockResolvedValueOnce(null),
      } as any);

      try {
        await service.updateUserRole(updateUserRoleDto, adminId);
        fail('예외가 발생해야 합니다');
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
        expect(error.message).toBe('User not found');
      }
      
      expect(userModel.findById).toHaveBeenCalledWith(adminId);
      expect(userModel.findOne).toHaveBeenCalledWith({ email: updateUserRoleDto.email });
    });
  });

  // 여기에 추가 테스트를 구현할 수 있습니다.
}); 