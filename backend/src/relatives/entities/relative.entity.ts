import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Case } from '../../cases/entities/case.entity';

export enum RelationshipType {
  CONYUGE = 'Conyuge',
  HIJO = 'Hijo',
  PADRE = 'Padre',
  HERMANO = 'Hermano',
  OTRO = 'Otro'
}

@Entity('Familiares')
export class Relative {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column({ type: 'varchar', enum: RelationshipType })
  relationship: RelationshipType;

  @Column({ nullable: true })
  age: number;

  @Column({ nullable: true })
  identification: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  email: string;

  @Column({ nullable: true })
  address: string;

  @Column({ nullable: true })
  pob: string;

  @ManyToOne(() => Case, (caso) => caso.relatives, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caso_id' })
  case: Case;
}