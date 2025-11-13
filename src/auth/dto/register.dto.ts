import {
  IsString,
  IsEmail,
  MinLength,
  MaxLength,
  Matches,
  IsOptional,
  IsInt,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ example: 'Nguyễn Văn An', description: 'Tên người dùng' })
  @IsString({ message: 'Tên phải là chuỗi ký tự' })
  @MinLength(2, { message: 'Tên phải có ít nhất 2 ký tự' })
  @MaxLength(50, { message: 'Tên không được quá 50 ký tự' })
  name: string;

  @ApiProperty({ example: 'user@example.com', description: 'Email' })
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @ApiProperty({ example: 'Password123', description: 'Mật khẩu (tối thiểu 8 ký tự, có chữ hoa, chữ thường và số)' })
  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @MinLength(8, { message: 'Password phải có ít nhất 8 ký tự' })
  @MaxLength(50, { message: 'Password không được quá 50 ký tự' })
  @Matches(/((?=.*\d)|(?=.*\W+))(?![.\n])(?=.*[A-Z])(?=.*[a-z]).*$/, {
    message: 'Password phải chứa chữ hoa, chữ thường và số',
  })
  password: string;

  @ApiProperty({ example: 25, description: 'Tuổi', required: false })
  @IsOptional()
  @IsInt({ message: 'Tuổi phải là số nguyên' })
  @Min(1, { message: 'Tuổi phải lớn hơn 0' })
  @Max(150, { message: 'Tuổi không được quá 150' })
  age?: number;

  @ApiProperty({ example: '0123456789', description: 'Số điện thoại', required: false })
  @IsOptional()
  @IsString({ message: 'Số điện thoại phải là chuỗi ký tự' })
  @MinLength(10, { message: 'Số điện thoại phải có ít nhất 10 ký tự' })
  @MaxLength(15, { message: 'Số điện thoại không được quá 15 ký tự' })
  phone?: string;
}
