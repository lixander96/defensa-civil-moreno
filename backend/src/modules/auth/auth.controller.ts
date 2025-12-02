import { Controller, Post, UseGuards, Get, UseInterceptors, ClassSerializerInterceptor, SerializeOptions, Patch } from '@nestjs/common';
import { ApiBearerAuth, ApiBody, ApiTags } from '@nestjs/swagger';
import { User } from '../user/entities/user.entity';
import { AuthService } from './auth.service';
import { UserAuth } from './decorators/user-auth.decorator';
import { LoginReqDTO } from './dtos/login-req.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { ChangePasswordReqDTO } from './dtos/change-password-req.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
@SerializeOptions({ excludeExtraneousValues:true })
@ApiTags('auth')
export class AuthController {
  constructor(private readonly _authService: AuthService) {}

  @Post('login')
  @ApiBody({type: LoginReqDTO})
  @UseGuards(LocalAuthGuard)
  login(@UserAuth() user: User) {
    return this._authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Get('profile')
  getProfile(@UserAuth() user: User) {
    return user;
  }
  
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @Patch('profile/password')
  @ApiBody({type: ChangePasswordReqDTO})
  changePassword(user: User, changePasswordReq: ChangePasswordReqDTO) {
    return this._authService.changePassword( user, changePasswordReq )
  }

}
