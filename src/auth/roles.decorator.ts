import { SetMetadata } from '@nestjs/common';

export const ROLES_KEY = 'roles';

/**
 * Decorator that assigns required roles to a route handler.
 * Used with RolesGuard to enforce Role-Based Access Control.
 *
 * @example
 * @Roles('admin')
 * @Delete(':id')
 * remove(@Param('id') id: number) { ... }
 */
export const Roles = (...roles: string[]) => SetMetadata(ROLES_KEY, roles);
