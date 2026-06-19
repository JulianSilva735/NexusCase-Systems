import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UserRole, UserPermission } from '../users/entities/user.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    @InjectRepository(User)
    private usersRepository: Repository<User>,
  ) {}

  async validateUser(email: string, pass: string): Promise<any> {
    const user = await this.usersService.findOneByEmail(email);
    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    // Obtener permisos del usuario
    const permissions = this.getUserPermissions(user);

    // Actualizar lastLogin
    await this.usersRepository.update(user.id, {
      lastLogin: new Date(),
    });

    const payload = { 
      email: user.email, 
      sub: user.id, 
      roles: user.roles,
      fullName: user.fullName || user.name,
      permissions,
    };

    return {
      accessToken: this.jwtService.sign(payload),
      user: {
        id: user.id,
        fullName: user.fullName,
        email: user.email,
        role: user.roles?.[0] || UserRole.OPERADOR,
        permissions,
        isActive: user.isActive,
        lastLogin: new Date().toISOString(),
      },
    };
  }

  /**
   * Obtiene los permisos del usuario según su rol
   * ADMINISTRADOR obtiene todos los permisos automáticamente
   * Otros roles tienen permisos granulares asignados
   */
  private getUserPermissions(user: any): string[] {
    // Si es administrador, dar todos los permisos
    if (user.roles?.includes(UserRole.ADMINISTRADOR)) {
      return Object.values(UserPermission);
    }

    // Para otros roles, devolver permisos específicos asignados
    return user.permissions || [];
  }
}