import { IsString, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { UserRole } from 'libs/database/schema/user.schema'; 

export class CreateUserDto {
  @IsEmail()
  email: string;

  @IsString()
  password: string;

  @IsString()
  nickname: string;

  @IsEnum(UserRole)
  @IsOptional()
  role?: UserRole;
}