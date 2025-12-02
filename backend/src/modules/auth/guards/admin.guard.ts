import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Role, User } from 'src/modules/user/entities/user.entity';

@Injectable()
export class AdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<{ user: User }>();

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException();
    }

    if (user.role !== Role.ADMIN) {
      throw new UnauthorizedException(
        'Access denied: You need administrator permissions to perform this action.',
      );
    }

    return true;
  }
}
