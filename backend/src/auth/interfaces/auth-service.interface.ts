import { User } from '../../users/schemas/user.schema';
import { PasswordDto } from '../dto/change-password.dto';
import { RegisterDto } from '../dto/register.dto';

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<{ message: string; email: string }>;
  
  validateUser(email: string, password: string): Promise<User | null>;
  
  login(user: User): Promise<{ message: string; email: string }>;
  
  verifyOtp(email: string, otp: string): Promise<{ access_token: string; refresh_token: string }>;
  
  resendOtp(email: string): Promise<{ message: string }>;

  changePassword(dto: PasswordDto, user: any): Promise<{ message: string }>
}
