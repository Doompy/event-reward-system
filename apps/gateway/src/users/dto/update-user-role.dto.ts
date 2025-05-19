import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from 'libs/database/schema/user.schema';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateUserRoleDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com'
  })
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: UserRole,
    example: UserRole.USER
  })
  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
} 