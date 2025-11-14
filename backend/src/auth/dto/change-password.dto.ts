import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class PasswordDto {
  @ApiProperty({ description: 'Mật khẩu hiện tại', example: 'oldPassword123' })
  @IsString({ message: 'Mật khẩu hiện tại phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu phải có ít nhất 6 ký tự' })
  currentPassword: string;

  @ApiProperty({ description: 'Mật khẩu mới', example: 'newPassword123' })
  @IsString({ message: 'Mật khẩu mới phải là chuỗi ký tự' })
  @MinLength(6, { message: 'Mật khẩu mới phải có ít nhất 6 ký tự' })
  newPassword: string;
}
