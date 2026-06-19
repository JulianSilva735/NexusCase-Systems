import { IsEmail, IsString, MinLength, IsOptional, IsEnum, IsArray, IsBoolean, ValidateNested } from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { UserRole } from '../entities/user.entity';

export class FrontendPermissions {
  @IsOptional()
  @IsBoolean()
  canManageTimes?: boolean;

  @IsOptional()
  @IsBoolean()
  canEditSurveys?: boolean;

  @IsOptional()
  @IsBoolean()
  canViewGlobalStats?: boolean;

  @IsOptional()
  @IsBoolean()
  canManageUsers?: boolean;
}

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  fullName: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(6)
  password: string;

  // Acepta role (singular) desde el frontend y lo convierte a array
  @IsOptional()
  @IsEnum(UserRole)
  @Transform(({ value, obj }) => {
    // Si viene 'role' singular, usarlo
    if (value) return value;
    // Si viene 'roles' array, tomar el primero
    if (obj.roles && Array.isArray(obj.roles)) return obj.roles[0];
    return undefined;
  })
  role?: UserRole;

  // Internamente usamos roles (array) para la entidad
  @IsOptional()
  @IsArray()
  @IsEnum(UserRole, { each: true })
  @Transform(({ value, obj }) => {
    // Si viene 'role' singular, convertir a array
    if (obj.role) return [obj.role];
    // Si viene 'roles' array, usarlo directamente
    if (value && Array.isArray(value)) return value;
    return undefined;
  })
  roles?: UserRole[];

  // Permisos granulares (array de strings backend)
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  permissions?: string[];

  // Permisos del frontend (objeto con booleans)
  @IsOptional()
  @ValidateNested()
  @Type(() => FrontendPermissions)
  frontendPermissions?: FrontendPermissions;
}