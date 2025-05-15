import { Injectable, CanActivate, ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from 'libs/database/schema/user.schema';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);

    // 역할 요구사항이 없으면 통과
    if (!requiredRoles) {
      return true;
    }

    const { user } = context.switchToHttp().getRequest();
    
    // 인증되지 않은 요청 거부
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }
    
    // 사용자의 역할이 필요한 역할 중 하나와 일치하는지 확인
    const hasRequiredRole = requiredRoles.some(role => user.role === role);
    
    if (!hasRequiredRole) {
      throw new ForbiddenException(`Access denied. Required role: ${requiredRoles.join(' or ')}`);
    }
    
    return true;
  }
} 