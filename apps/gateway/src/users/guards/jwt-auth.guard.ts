import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users.service';
import { JwtService } from '@nestjs/jwt';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from '../../common/decorators/public.decorator';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private reflector: Reflector
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // Public 라우트 체크
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    this.logger.log('🚨🚨🚨 AUTH GUARD CALLED 🚨🚨🚨');
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      this.logger.warn('No authorization header provided');
      throw new UnauthorizedException('No token provided');
    }
    
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer') {
      this.logger.warn(`Invalid token type: ${type}`);
      throw new UnauthorizedException('Invalid token type');
    }
    
    try {
      // JWT 토큰 검증 및 사용자 정보 가져오기
      this.logger.log(`Verifying JWT token locally: ${token.substring(0, 15)}...`);
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
      this.logger.log(`JWT payload verified: ${JSON.stringify(payload)}`);
      
      // Auth 서비스에서 사용자 정보 가져오기
      this.logger.log(`Validating token with Auth service: ${token.substring(0, 15)}...`);
      try {
        const userData = await this.usersService.validateToken(token);
        this.logger.log(`User data from Auth service: ${JSON.stringify(userData)}`);
        
        // 사용자 정보를 요청 객체에 설정
        request.user = userData;
        this.logger.log('✅ Authentication successful');
        return true;
      } catch (error) {
        this.logger.error(`Error validating token with Auth service: ${error.message}`);
        this.logger.log(`Error stack: ${error.stack}`);
        this.logger.log(`Falling back to local JWT payload`);
        
        // Auth 서비스에서 검증 실패하면 토큰의 정보만 사용
        request.user = {
          _id: payload.sub,
          email: payload.email,
          role: payload.role,  // 타입 확인 필요
          nickname: payload.nickname,
        };
        
        this.logger.log(`Using JWT payload as user: ${JSON.stringify(request.user)}`);
        return true;
      }
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      this.logger.error(`Error stack: ${error.stack}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
} 