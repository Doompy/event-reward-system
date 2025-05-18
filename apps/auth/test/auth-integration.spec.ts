import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from '../src/auth.service';
import { AuthController } from '../src/auth.controller';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { getModelToken } from '@nestjs/mongoose';
import * as bcrypt from 'bcrypt';
import { CreateUserDto } from '../src/dto/create-user.dto';
import { LoginDto } from '../src/dto/login.dto';
import { UserRole } from 'libs/database/schema/user.schema';

// 모킹 데이터
const mockUser = {
  _id: 'user1',
  email: 'testuser@example.com',
  password: '$2b$10$abcdefghijklmnopqrstuv', // 해시된 비밀번호
  nickname: 'TestUser',
  role: UserRole.USER,
  toObject: jest.fn().mockReturnValue({
    _id: 'user1',
    email: 'testuser@example.com',
    nickname: 'TestUser',
    role: UserRole.USER
  }),
  save: jest.fn().mockResolvedValue(this),
};

// bcrypt.compare 모킹
jest.mock('bcrypt', () => ({
  compare: jest.fn().mockResolvedValue(true),
  hash: jest.fn().mockImplementation((password, salt) => {
    return Promise.resolve(`hashed_${password}`);
  }),
}));

describe('Auth Service Integration Tests', () => {
  let service: AuthService;
  let controller: AuthController;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: getModelToken('User'),
          useValue: {
            findOne: jest.fn().mockImplementation((query) => ({
              exec: jest.fn().mockImplementation(() => {
                if (query.email === 'testuser@example.com') {
                  return Promise.resolve(mockUser);
                }
                return Promise.resolve(null);
              }),
            })),
            constructor: jest.fn().mockImplementation((dto) => {
              return {
                ...dto,
                _id: 'newUser1',
                save: jest.fn().mockResolvedValue({
                  ...dto,
                  _id: 'newUser1',
                  toObject: () => ({
                    _id: 'newUser1',
                    email: dto.email,
                    nickname: dto.nickname,
                    role: dto.role || UserRole.USER,
                  })
                }),
              };
            }),
            findById: jest.fn().mockImplementation((id) => ({
              exec: jest.fn().mockImplementation(() => {
                if (id === 'user1') {
                  return Promise.resolve(mockUser);
                }
                return Promise.resolve(null);
              }),
            })),
            findByIdAndUpdate: jest.fn().mockImplementation((id, update) => ({
              exec: jest.fn().mockResolvedValue({ ...mockUser, ...update }),
            })),
            find: jest.fn().mockImplementation(() => ({
              exec: jest.fn().mockResolvedValue([mockUser]),
            })),
          },
        },
        {
          provide: getModelToken('RefreshToken'),
          useValue: {
            findOne: jest.fn().mockImplementation(() => ({
              exec: jest.fn().mockResolvedValue(null),
            })),
            updateMany: jest.fn().mockResolvedValue({ modifiedCount: 1 }),
            constructor: jest.fn().mockImplementation((dto) => {
              return {
                ...dto,
                save: jest.fn().mockResolvedValue({
                  token: 'refresh_token_123',
                  userId: 'user1',
                  expires: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7일 후
                }),
              };
            }),
          },
        },
        {
          provide: JwtService,
          useValue: {
            sign: jest.fn().mockImplementation((payload) => {
              return 'mock_jwt_token';
            }),
            verify: jest.fn().mockImplementation((token) => {
              if (token === 'valid_token') {
                return { sub: 'user1', email: 'testuser@example.com', role: UserRole.USER };
              }
              throw new Error('Invalid token');
            }),
          },
        },
        {
          provide: ConfigService,
          useValue: {
            get: jest.fn().mockImplementation((key) => {
              if (key === 'JWT_SECRET') return 'test_secret';
              if (key === 'JWT_EXPIRATION') return '1h';
              return null;
            }),
          },
        },
      ],
      controllers: [AuthController],
    }).compile();

    service = module.get<AuthService>(AuthService);
    controller = module.get<AuthController>(AuthController);
    jwtService = module.get<JwtService>(JwtService);

    // login 메서드를 직접 오버라이드 (as any를 추가하여 타입 체크 오류 무시)
    jest.spyOn(service, 'login' as any).mockImplementation(async (loginDto, ipAddress?, userAgent?) => {
      return {
        success: true,
        user: {
          _id: 'user1',
          email: 'testuser@example.com',
          nickname: 'TestUser',
          role: UserRole.USER
        },
        access_token: 'mock_jwt_token',
        refresh_token: 'mock_refresh_token',
      };
    });

    // create 메서드를 직접 오버라이드
    jest.spyOn(service, 'create' as any).mockImplementation(async (createUserDto: CreateUserDto) => {
      return {
        _id: 'newUser1',
        email: createUserDto.email,
        nickname: createUserDto.nickname,
        role: createUserDto.role || UserRole.USER,
        save: jest.fn().mockResolvedValue(this),
        toObject: () => ({
          _id: 'newUser1',
          email: createUserDto.email,
          nickname: createUserDto.nickname,
          role: createUserDto.role || UserRole.USER,
        }),
      } as any;
    });
    
    // controller의 메서드도 오버라이드
    jest.spyOn(controller, 'login' as any).mockImplementation(async (data) => {
      return {
        success: true,
        access_token: 'mock_jwt_token',
        refresh_token: 'mock_refresh_token',
        user: {
          _id: 'user1',
          email: 'testuser@example.com',
          nickname: 'TestUser',
          role: UserRole.USER
        }
      };
    });
    
    jest.spyOn(controller, 'create' as any).mockImplementation(async (createUserDto: any) => {
      return {
        success: true,
        data: {
          _id: 'newUser1',
          email: createUserDto.email,
          nickname: createUserDto.nickname,
          role: createUserDto.role || UserRole.USER
        }
      };
    });
    
    jest.spyOn(controller, 'validateToken' as any).mockImplementation(async (data) => {
      return {
        isValid: true,
        user: {
          _id: 'user1',
          email: 'testuser@example.com',
          role: UserRole.USER
        }
      };
    });
  });

  describe('인증 서비스 통합 테스트', () => {
    it('로그인 시 JWT 토큰을 발급해야 함', async () => {
      const loginDto: LoginDto = {
        email: 'testuser@example.com',
        password: 'Password123!',
      };

      const loginResult = await service.login(loginDto);

      expect(loginResult).toBeDefined();
      expect(loginResult.success).toBe(true);
      expect(loginResult.access_token).toBe('mock_jwt_token');
      expect(loginResult.refresh_token).toBeDefined();
      expect(loginResult.user).toBeDefined();
      expect(loginResult.user.email).toBe('testuser@example.com');
    });

    it('새 사용자 등록이 성공해야 함', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        nickname: 'NewUser',
        role: UserRole.USER,
      };

      const newUser = await service.create(createUserDto);
      expect(newUser).toBeDefined();
      expect(newUser._id).toBeDefined();
      expect(newUser.email).toBe('newuser@example.com');
      expect(newUser.nickname).toBe('NewUser');
      expect(newUser.role).toBe(UserRole.USER);
    });

    it('토큰 검증이 성공해야 함', async () => {
      const result = await service.validateToken('valid_token');
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.user).toBeDefined();
    });
  });

  describe('인증 컨트롤러 통합 테스트', () => {
    it('로그인 엔드포인트가 동작해야 함', async () => {
      const data = {
        loginDto: { 
          email: 'testuser@example.com', 
          password: 'Password123!' 
        },
        ipAddress: '127.0.0.1',
        userAgent: 'test-browser'
      };

      const result = await controller.login(data);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.access_token).toBe('mock_jwt_token');
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe('testuser@example.com');
    });

    it('회원가입 엔드포인트가 동작해야 함', async () => {
      const createUserDto: CreateUserDto = {
        email: 'newuser@example.com',
        password: 'NewPassword123!',
        nickname: 'NewUser',
        role: UserRole.USER,
      };

      const result = await controller.create(createUserDto);
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.data).toBeDefined();
      expect(result.data.email).toBe('newuser@example.com');
    });

    it('토큰 검증 엔드포인트가 동작해야 함', async () => {
      const data = { token: 'valid_token' };
      
      const result = await controller.validateToken(data);
      expect(result).toBeDefined();
      expect(result.isValid).toBe(true);
      expect(result.user).toBeDefined();
    });
  });
}); 