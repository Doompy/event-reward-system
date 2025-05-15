import { IsEmail, IsEnum, IsNotEmpty } from 'class-validator';
import { UserRole } from 'libs/database/schema/user.schema';

export class UpdateUserRoleDto {
  @IsEmail()
  @IsNotEmpty()
  email: string;

  @IsEnum(UserRole)
  @IsNotEmpty()
  role: UserRole;
} 