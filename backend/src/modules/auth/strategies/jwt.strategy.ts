import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtPayload } from '../payloads/jwt.payload';
import { AuthService } from '../auth.service';
import { EnvironmentVariables } from '../../../config/config.configuration';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
    constructor(
        private readonly _configService: ConfigService<EnvironmentVariables>,
        private  _authService: AuthService,
    ) {
        super({
        jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
        ignoreExpiration: false,
        secretOrKey: _configService.get('JWT_SECRET'),
        });
    }

    async validate(payload: JwtPayload) {
        const user = this._authService.validateJwt(payload);
        if(!user) {
            throw new UnauthorizedException()
        }
        return user
    }
}