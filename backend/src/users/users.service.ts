import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { User, UserRole, UserPermission } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';

@Injectable()
export class UsersService implements OnModuleInit {
  private readonly logger = new Logger(UsersService.name);
  private readonly saltRounds: number;

  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private configService: ConfigService,
  ) {
    this.saltRounds = this.configService.get<number>('BCRYPT_SALT_ROUNDS', 10);
  }

  async onModuleInit() {
    await this.seedAdminUser();
  }

  async seedAdminUser() {
    const adminEmail = this.configService.get<string>('ADMIN_EMAIL');
    const adminPassword = this.configService.get<string>('ADMIN_PASSWORD');
    const adminName = this.configService.get<string>('ADMIN_NAME');

    if (!adminEmail || !adminPassword || !adminName) {
      this.logger.warn('⚠️ Variables de entorno ADMIN_EMAIL, ADMIN_PASSWORD o ADMIN_NAME no configuradas. Omitiendo seed de usuario admin.');
      return;
    }

    const adminExists = await this.usersRepository.findOne({
      where: { email: adminEmail },
      select: ['id', 'email', 'password', 'roles', 'fullName', 'isActive'],
    });

    if (!adminExists) {
      this.logger.log('🚀 Base de datos vacía. Creando Usuario Administrador...');

      const hashedPassword = await bcrypt.hash(adminPassword, this.saltRounds);

      const newAdmin = this.usersRepository.create({
        fullName: adminName,
        email: adminEmail,
        password: hashedPassword,
        roles: [UserRole.ADMINISTRADOR],
        isActive: true,
      });

      await this.usersRepository.save(newAdmin);
      this.logger.log(`✅ Usuario Administrador creado: ${adminEmail}`);
      return;
    }

    const passwordMatches = adminExists.password
      ? await bcrypt.compare(adminPassword, adminExists.password)
      : false;

    if (!passwordMatches || adminExists.fullName !== adminName || !adminExists.roles?.includes(UserRole.ADMINISTRADOR)) {
      const hashedPassword = await bcrypt.hash(adminPassword, this.saltRounds);

      await this.usersRepository.update(adminExists.id, {
        fullName: adminName,
        password: hashedPassword,
        roles: [UserRole.ADMINISTRADOR],
        isActive: true,
      });

      this.logger.log(`✅ Usuario Administrador sincronizado: ${adminEmail}`);
    }
  }


  async create(createUserDto: CreateUserDto) {
    const { password, role, frontendPermissions, ...userData } = createUserDto;

    // Encriptar contraseña
    const hashedPassword = await bcrypt.hash(password, this.saltRounds);

    // Normalizar role singular a roles array
    const roles = role ? [role] : userData.roles || [];

    // Mapear permisos frontend a backend
    const permissions = this.mapFrontendPermissions(frontendPermissions, userData.permissions);

    const newUser = this.usersRepository.create({
      ...userData,
      password: hashedPassword,
      roles,
      permissions,
    });

    return this.usersRepository.save(newUser);
  }

  /**
   * Mapea permisos del frontend (booleans) a códigos backend (strings)
   * Si vienen permisos directos (backend), los usa directamente
   */
  private mapFrontendPermissions(frontendPermissions?: any, backendPermissions?: string[]): string[] {
    // Si vienen permisos backend directamente, usarlos
    if (backendPermissions && Array.isArray(backendPermissions)) {
      return backendPermissions;
    }

    // Si no hay permisos frontend, devolver array vacío
    if (!frontendPermissions) {
      return [];
    }

    const permissions: string[] = [];

    if (frontendPermissions.canManageTimes) {
      permissions.push(UserPermission.MANAGE_TIME);
    }
    if (frontendPermissions.canEditSurveys) {
      permissions.push(UserPermission.MANAGE_SURVEY);
    }
    if (frontendPermissions.canViewGlobalStats) {
      permissions.push(UserPermission.VIEW_ADMIN_STATS);
    }
    if (frontendPermissions.canManageUsers) {
      permissions.push(UserPermission.MANAGE_USERS);
    }

    return permissions;
  }

  findAll() {
    return this.usersRepository.find();
  }

  findOne(id: string) {
    return this.usersRepository.findOneBy({ id });
  }

  async findOneByEmail(email: string) {
    return this.usersRepository.findOne({
      where: { email },
      // Importante para el Login: traer el password, permissions y otros datos
      select: ['id', 'email', 'password', 'roles', 'fullName', 'isActive', 'permissions', 'lastLogin']
    });
  }

  async update(id: string, updateUserDto: UpdateUserDto) {
    const { password, role, frontendPermissions, ...rest } = updateUserDto as any;
    const updateData: any = { ...rest };

    // Encriptar contraseña si se está actualizando
    if (password) {
      updateData.password = await bcrypt.hash(password, this.saltRounds);
    }

    // Normalizar role singular a roles array
    if (role) {
      updateData.roles = [role];
    }

    // Mapear permisos frontend a backend si vienen
    if (frontendPermissions || rest.permissions) {
      updateData.permissions = this.mapFrontendPermissions(frontendPermissions, rest.permissions);
    }

    return this.usersRepository.update(id, updateData);
  }

  remove(id: string) {
    return this.usersRepository.delete(id);
  }
}