import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from 'libs/database/schema/user.schema';
import { ApiProperty } from '@nestjs/swagger';

export class CreateUserDto {
  @ApiProperty({
    description: '사용자 이메일',
    example: 'user@example.com'
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: '사용자 비밀번호',
    example: 'password123'
  })
  @IsString()
  password: string;

  @ApiProperty({
    description: '사용자 닉네임',
    example: '홍길동'
  })
  @IsString()
  nickname: string;

  @ApiProperty({
    description: '사용자 역할',
    enum: UserRole,
    example: UserRole.USER,
    required: false
  })
  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}