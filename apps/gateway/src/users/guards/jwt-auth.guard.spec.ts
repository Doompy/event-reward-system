import { Test, TestingModule } from '@nestjs/testing';
import { JwtAuthGuard } from './jwt-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users.service';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let jwtService: JwtService;
  let usersService: UsersService;
  let reflector: Reflector;

  const mockGetAllAndOverride = jest.fn().mockReturnValue(false);

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
        },
        {
          provide: Reflector,
          useValue: {
            getAllAndOverride: mockGetAllAndOverride
          }
        }
      ],
    }).compile();

    guard = module.get<JwtAuthGuard>(JwtAuthGuard);
    jwtService = module.get<JwtService>(JwtService);
    usersService = module.get<UsersService>(UsersService);
    reflector = module.get<Reflector>(Reflector);
  });

  it('정의되어 있어야 함', () => {
    expect(guard).toBeDefined();
  });

  describe('canActivate', () => {
    it('Public 경로에 대해 true를 반환해야 함', async () => {
      // Public 데코레이터가 적용된 경로를 모킹
      mockGetAllAndOverride.mockReturnValueOnce(true);

      const mockExecutionContext = {
        switchToHttp: jest.fn(),
        getHandler: jest.fn(),
        getClass: jest.fn(),
      } as unknown as ExecutionContext;

      const result = await guard.canActivate(mockExecutionContext);
      
      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(IS_PUBLIC_KEY, [
        mockExecutionContext.getHandler(),
        mockExecutionContext.getClass(),
      ]);
    });

    it('토큰이 유효할 때 true를 반환해야 함', async () => {
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

      // Public 경로가 아님을 설정
      mockGetAllAndOverride.mockReturnValueOnce(false);

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockUser);
      jest.spyOn(usersService, 'validateToken').mockResolvedValue(mockUser);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual(mockUser);
    });

    it('Auth 서비스 검증 실패 시 로컬 JWT 검증을 사용해야 함', async () => {
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

      // Public 경로가 아님을 설정
      mockGetAllAndOverride.mockReturnValueOnce(false);

      jest.spyOn(jwtService, 'verify').mockReturnValue(mockPayload);
      jest.spyOn(usersService, 'validateToken').mockRejectedValue(new Error('Auth 서비스 사용 불가'));

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
      expect(mockRequest.user).toEqual({
        _id: mockPayload.sub,
        email: mockPayload.email,
        role: mockPayload.role,
        nickname: mockPayload.nickname,
      });
    });

    it('JWT 검증 실패 시 UnauthorizedException을 발생시켜야 함', async () => {
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

      // Public 경로가 아님을 설정
      mockGetAllAndOverride.mockReturnValueOnce(false);

      // JWT verify 결과를 조건부로 모킹
      let jwtVerifyCalled = false;
      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        if (!jwtVerifyCalled) {
          jwtVerifyCalled = true;
          throw new Error('JWT 검증 실패');
        }
        // 이 부분은 가드에서 예외가 발생하므로 호출되지 않음
        return { sub: 'user_id', email: 'user@example.com', role: 'USER' };
      });

      // validateToken이 성공하도록 모킹
      jest.spyOn(usersService, 'validateToken').mockResolvedValue(mockUser);

      // UnauthorizedException이 발생하는지 확인
      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
      expect(jwtService.verify).toHaveBeenCalled();
      expect(usersService.validateToken).not.toHaveBeenCalled();
    });

    it('토큰이 제공되지 않을 때 UnauthorizedException을 발생시켜야 함', async () => {
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

      // Public 경로가 아님을 설정
      mockGetAllAndOverride.mockReturnValueOnce(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('토큰 타입이 Bearer가 아닐 때 UnauthorizedException을 발생시켜야 함', async () => {
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

      // Public 경로가 아님을 설정
      mockGetAllAndOverride.mockReturnValueOnce(false);

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });

    it('토큰이 유효하지 않을 때 UnauthorizedException을 발생시켜야 함', async () => {
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

      // Public 경로가 아님을 설정
      mockGetAllAndOverride.mockReturnValueOnce(false);

      jest.spyOn(jwtService, 'verify').mockImplementation(() => {
        throw new Error('유효하지 않은 토큰');
      });
      
      jest.spyOn(usersService, 'validateToken').mockRejectedValue(new Error('유효하지 않은 토큰'));

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(UnauthorizedException);
    });
  });
}); 