import { SetMetadata } from '@nestjs/common';
import { UserRole } from 'libs/database/schema/user.schema';

export const Roles = (...roles: UserRole[]) => SetMetadata('roles', roles); 