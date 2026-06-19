import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class PermissionsGuard implements CanActivate {
    constructor(private reflector: Reflector) { }

    canActivate(context: ExecutionContext): boolean {
        const requiredPermissions = this.reflector.getAllAndOverride<string[]>(PERMISSIONS_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        if (!requiredPermissions) {
            return true; // No permissions required
        }

        const { user } = context.switchToHttp().getRequest();

        // 1. Super Admin Bypass (optional, but recommended)
        if (user.roles?.includes(UserRole.ADMINISTRADOR)) {
            return true;
        }

        // 2. Check Granular Permissions
        const userPermissions = user.permissions || [];
        const hasPermission = requiredPermissions.every((permission) =>
            userPermissions.includes(permission),
        );

        if (!hasPermission) {
            throw new ForbiddenException('No tienes permisos suficientes para realizar esta acción');
        }

        return true;
    }
}
