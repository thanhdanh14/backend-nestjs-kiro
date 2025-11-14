import { SetMetadata } from '@nestjs/common';
import { Role } from '../enums/role.enum';

// Key để lưu metadata
export const ROLES_KEY = 'roles';

// Decorator để đánh dấu route cần roles nào
export const Roles = (...roles: Role[]) => SetMetadata(ROLES_KEY, roles);

// Sử dụng:
// @Roles(Role.ADMIN)
// @Get('admin-only')
// adminOnlyRoute() { }
//
// @Roles(Role.ADMIN, Role.MODERATOR)
// @Get('admin-or-moderator')
// adminOrModeratorRoute() { }
