import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '../enums/role.enum';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  // RolesGuard = Guard kiểm tra user có đủ quyền không
  
  constructor(private reflector: Reflector) {
    // Reflector = Tool để đọc metadata từ decorator
  }

  canActivate(context: ExecutionContext): boolean {
    // canActivate() = Method quyết định cho phép access hay không
    // Trả về true = Cho phép, false = Từ chối (403 Forbidden)
    
    // 1. Lấy roles required từ @Roles() decorator
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>(ROLES_KEY, [
      context.getHandler(),  // Method level (@Roles() trên method)
      context.getClass(),    // Class level (@Roles() trên controller)
    ]);
    
    // 2. Nếu không có @Roles() decorator → Cho phép access
    if (!requiredRoles) {
      return true;
    }
    
    // 3. Lấy user từ request
    const { user } = context.switchToHttp().getRequest();
    
    // 4. Kiểm tra user có ít nhất 1 role trong requiredRoles không
    return requiredRoles.some((role) => user.roles?.includes(role));
    // some() = Trả về true nếu có ít nhất 1 phần tử thỏa điều kiện
    //
    // Ví dụ:
    //   requiredRoles = [Role.ADMIN, Role.MODERATOR]
    //   user.roles = [Role.USER] → false (không có quyền)
    //   user.roles = [Role.ADMIN] → true (có quyền)
    //   user.roles = [Role.MODERATOR] → true (có quyền)
    //   user.roles = [Role.ADMIN, Role.USER] → true (có quyền)
  }
}
