
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';

export interface JwtPayload {
  email: string;
  sub: string;
  roles: string[];
  fullName: string;
  permissions: string[];
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    configService: ConfigService,
    private readonly usersService: UsersService,
  ) {
    const secret = configService.get<string>('JWT_SECRET');

    if (!secret) {
      throw new Error('FATAL: JWT_SECRET no está definido en el archivo .env');
    }

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret,
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: id } = payload;
    const user = await this.usersService.findOne(id);

    if (!user) {
      throw new UnauthorizedException('Token no válido o usuario inactivo/eliminado.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Token no válido o usuario inactivo/eliminado.');
    }

    const { password, ...cleanUser } = user as any;
    if (!cleanUser.permissions) {
      cleanUser.permissions = [];
    }

    return cleanUser;
  }
}