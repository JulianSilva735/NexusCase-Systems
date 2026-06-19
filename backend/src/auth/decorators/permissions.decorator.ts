import { SetMetadata } from '@nestjs/common';
import { UserPermission } from '../../users/entities/user.entity';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermissions = (...permissions: UserPermission[]) => SetMetadata(PERMISSIONS_KEY, permissions);
