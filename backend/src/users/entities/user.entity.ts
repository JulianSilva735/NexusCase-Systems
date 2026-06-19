import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  OneToMany
} from 'typeorm';
import * as bcrypt from 'bcrypt';
import { Case } from '../../cases/entities/case.entity';

export enum UserRole {
  ADMINISTRADOR = 'ADMINISTRADOR',
  SUPERVISOR = 'SUPERVISOR',
  OPERADOR = 'OPERADOR',
}

export enum UserPermission {
  MANAGE_TIME = 'MANAGE_TIME',
  MANAGE_SURVEY = 'MANAGE_SURVEY',
  VIEW_ADMIN_STATS = 'VIEW_ADMIN_STATS',
  MANAGE_USERS = 'MANAGE_USERS',
}

@Entity('Usuarios')
export class User {

  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'nombre', type: 'varchar', length: 100 })
  fullName: string;

  @Column({ name: 'email', type: 'varchar', length: 100, unique: true })
  email: string;

  @Column({ name: 'clave_hash', type: 'varchar', length: 255, select: false })
  password: string;

  @Column({ name: 'roles', type: 'simple-array', default: UserRole.OPERADOR })
  roles: string[];

  @Column({ name: 'permissions', type: 'simple-array', nullable: true })
  permissions: string[];

  @Column({ name: 'activo', type: 'boolean', default: true })
  isActive: boolean;

  @Column({ name: 'ultimo_login', type: 'datetime', nullable: true })
  lastLogin: Date;

  @CreateDateColumn({ name: 'fecha_creacion' })
  createdAt: Date;

  // 👇 RELACIÓN AGREGADA CORRECTAMENTE
  @OneToMany(() => Case, (caso) => caso.assignedTo)
  cases: Case[];

  async checkPassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password);
  }
}