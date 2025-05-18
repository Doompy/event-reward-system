import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, Logger } from '@nestjs/common';
import { UsersService } from '../users.service';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const authHeader = request.headers.authorization;
    
    if (!authHeader) {
      throw new UnauthorizedException('No token provided');
    }
    
    const [type, token] = authHeader.split(' ');
    
    if (type !== 'Bearer') {
      throw new UnauthorizedException('Invalid token type');
    }
    
    try {
      // 1. 로컬에서 JWT 검증 먼저 시도
      try {
        const payload = this.jwtService.verify(token);
        
        // 기본 검증 통과, 추가 데이터가 필요하면 Auth 서비스 호출
        try {
          const user = await this.usersService.validateToken(token);
          request.user = user;
          return true;
        } catch (authServiceError) {
          this.logger.warn(`Auth service validation failed: ${authServiceError.message}`);
          
          // Auth 서비스 호출 실패 시, 기본 페이로드로 최소한의 정보 제공
          request.user = {
            _id: payload.sub,
            email: payload.email,
            role: payload.role,
            nickname: payload.nickname,
            // 중요: 완전한 사용자 정보가 아님을 표시
            isPartialUser: true,
          };
          return true;
        }
      } catch (jwtError) {
        // 로컬 JWT 검증 실패, Auth 서비스로 시도
        this.logger.debug(`Local JWT validation failed: ${jwtError.message}`);
        const user = await this.usersService.validateToken(token);
        request.user = user;
        return true;
      }
    } catch (error) {
      this.logger.error(`Authentication failed: ${error.message}`);
      throw new UnauthorizedException('Invalid token');
    }
  }
} 