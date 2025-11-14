import { IsEmail, IsString, Length } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    example: 'user@example.com',
    description: 'Email của user',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    example: '123456',
    description: 'Mã OTP 6 số',
  })
  @IsString()
  @Length(6, 6, { message: 'OTP phải có đúng 6 ký tự' })
  otp: string;
}
