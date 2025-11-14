import { User } from '../../users/schemas/user.schema';
import { RegisterDto } from '../dto/register.dto';

export interface IAuthService {
  register(registerDto: RegisterDto): Promise<{ user: User; access_token: string }>;
  
  validateUser(email: string, password: string): Promise<User | null>;
  
  login(user: User): Promise<{ access_token: string }>;
}
