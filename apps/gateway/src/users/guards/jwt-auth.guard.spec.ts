import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users.service';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let usersService: UsersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        JwtAuthGuard,
        {
          provide: JwtService,
          useValue: {
            verifyAsync: jest.fn(),
            verify: jest.fn(),
          },
        },
        {
          provide: UsersService,
          useValue: {
            validateToken: jest.fn(),
          }
        }
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('should return true when token is valid', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
        user: null,
      };

      const mockUser = {
        _id: 'user_id',
        email: 'user@example.com',
        role: 'USER',
      };

      // 실행 컨텍스트 모킹
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockUser);
      jest.spyOn(usersService, 'validateToken').mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should use local JWT verification when Auth service validation fails', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
        user: null,
      };

      const mockPayload = {
        sub: 'user_id',
        email: 'user@example.com',
        role: 'USER',
        nickname: 'testuser',
      };

      // 실행 컨텍스트 모킹
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(usersService, 'validateToken').mockRejectedValue(new Error('Auth service unavailable'));

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({
        _id: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
        nickname: mockPayload.nickname,
        isPartialUser: true,
      });
    });

    it('should try Auth service validation when local JWT verification fails', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer valid_token',
        },
        user: null,
      };

      const mockUser = {
        _id: 'user_id',
        email: 'user@example.com',
        role: 'USER',
      };

      // 실행 컨텍스트 모킹
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('JWT verification failed');
      });
      jest.spyOn(usersService, 'validateToken').mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('should throw UnauthorizedException when no token is provided', async () => {
      const mockRequest = {
        headers: {},
      };

      // 실행 컨텍스트 모킹
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token type is not Bearer', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Basic invalid_token_type',
        },
      };

      // 실행 컨텍스트 모킹
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException when token is invalid', async () => {
      const mockRequest = {
        headers: {
          authorization: 'Bearer invalid_token',
        },
      };

      // 실행 컨텍스트 모킹
      const mockExecutionContext = {
        switchToHttp: jest.fn().mockReturnValue({
          getRequest: jest.fn().mockReturnValue(mockRequest),
        }),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('Invalid token');
      });
      
      jest.spyOn(usersService, 'validateToken').mockRejectedValue(new Error('Invalid token'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 