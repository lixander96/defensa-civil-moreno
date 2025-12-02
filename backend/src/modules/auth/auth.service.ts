import { BadRequestException, Injectable } from '@nestjs/common';
import { User } from '../user/entities/user.entity';
import * as bcrypt from 'bcrypt';
import { LoginResDTO } from './dtos/login-res.dto';
import { JwtPayload } from './payloads/jwt.payload';
import { JwtService } from '@nestjs/jwt';
import { plainToClass } from 'class-transformer';
import { Repository } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { ChangePasswordReqDTO } from './dtos/change-password-req.dto';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly _authRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, pass: string): Promise<User | null> {
    const user = await this._authRepository.findOne({ where: { username } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const match = await bcrypt.compare(pass, user.password);
    if (!match) return null;
    return user;
  }

  async validateJwt(payload: JwtPayload): Promise<User | null> {
    const { id, username, password } = payload;
    const user = await this._authRepository.findOne({
      where: { id, username, password },
    });
    return user;
  }

  async login(user: User): Promise<LoginResDTO> {
    const payload: JwtPayload = {
      username: user.username,
      id: user.id,
      password: user.password,
    };
    return plainToClass(LoginResDTO, {
      ...user,
      access_token: this.jwtService.sign(payload),
    });
  }

  async changePassword(user: User, changePasswordReq: ChangePasswordReqDTO): Promise<User> {
    const { oldPassword, newPassword } = changePasswordReq;
    
    const dbUser = await this._authRepository.findOne({
      where: { id: user.id },
    });
    const match = await bcrypt.compare(oldPassword, dbUser.password);
    if (!match) {
      throw new BadRequestException('Invalid old password');
    }
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    dbUser.password = hashedPassword;
    
    await this._authRepository.save(dbUser);
    return dbUser;
  }
}
