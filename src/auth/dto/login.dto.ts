import { IsEmail, IsString, MinLength } from 'class-validator';

export class LoginDto {
  @IsEmail({}, { message: 'Email không hợp lệ' })
  email: string;

  @IsString({ message: 'Password phải là chuỗi ký tự' })
  @MinLength(1, { message: 'Password không được để trống' })
  password: string;
}
