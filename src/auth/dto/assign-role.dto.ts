import { IsEnum, IsArray, ArrayMinSize } from 'class-validator';
import { Role } from '../enums/role.enum';

export class AssignRoleDto {
  @IsArray({ message: 'Roles phải là mảng' })
  @ArrayMinSize(1, { message: 'Phải có ít nhất 1 role' })
  @IsEnum(Role, { each: true, message: 'Role không hợp lệ' })
  // each: true = Validate từng phần tử trong mảng
  roles: Role[];
}

// Sử dụng:
// POST /users/:id/roles
// Body: { "roles": ["admin", "moderator"] }
