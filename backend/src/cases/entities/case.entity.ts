import { 
  Entity, 
  PrimaryGeneratedColumn, 
  Column, 
  ManyToOne, 
  OneToMany, 
  CreateDateColumn, 
  UpdateDateColumn, 
  JoinColumn 
} from 'typeorm';

import { User } from '../../users/entities/user.entity';
import { Document } from '../../documents/entities/document.entity';
import { Relative } from '../../relatives/entities/relative.entity';
import { CaseHistory } from './case-history.entity';
import { CaseActivity } from './case-activity.entity'; 
import { CaseState } from './case-state.entity';

export enum CaseStatus {
  NUEVO = 'NUEVO',
  RECOLECCION = 'RECOLECCION',
  ANALISIS = 'ANALISIS',
  COMITE = 'COMITE',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum CasePriority {
  ALTA = 'ALTA',
  MEDIA = 'MEDIA',
  BAJA = 'BAJA',
}

@Entity('cases')
export class Case {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true, nullable: true })
  caseCode: string;

  @Column()
  clientName: string;

  @Column()
  clientIdNumber: string;

  @Column({ nullable: true })
  clientPhone: string;

  @Column({ nullable: true })
  clientEmail: string;

  @Column({ nullable: true })
  clientAddress: string;

  @Column({ nullable: true })
  clientGender: string;

  @Column({ nullable: true })
  clientDob: string;

  @Column({ nullable: true })
  clientPob: string;

  @Column({ nullable: true })
  clientExpeditionPlace: string;

  @Column({ nullable: true })
  clientFatherName: string;

  @Column({ nullable: true })
  clientFatherId: string;

  @Column({ nullable: true })
  clientFatherAge: string;

  @Column({ nullable: true })
  clientFatherPhone: string;

  @Column({ nullable: true })
  clientFatherEmail: string;

  // --- DATOS DE LA MADRE ---
  @Column({ nullable: true })
  clientMotherName: string;

  @Column({ nullable: true })
  clientMotherId: string;

  @Column({ nullable: true })
  clientMotherAge: string;

  @Column({ nullable: true })
  clientMotherPhone: string;

  @Column({ nullable: true })
  clientMotherEmail: string;

  @Column({
    type: 'varchar',
    enum: CaseStatus,
    default: CaseStatus.NUEVO,
  })
  status: CaseStatus;

  @ManyToOne(() => CaseState)
  @JoinColumn({ name: 'status', referencedColumnName: 'id' })
  stateConfig: CaseState;

  @Column({ type: 'json', nullable: true }) 
  surveyAnswers: any;

  @Column({
    type: 'varchar',
    enum: CasePriority,
    default: CasePriority.MEDIA,
  })
  priority: CasePriority;

  @Column({ type: 'datetime', nullable: true })
  deadline: Date;
  
  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @ManyToOne(() => User, (user) => user.cases, { nullable: true })
  @JoinColumn({ name: 'assigned_to_id' })
  assignedTo: User;

  @OneToMany(() => Document, (doc) => doc.case)
  documents: Document[];

  @OneToMany(() => Relative, (rel) => rel.case)
  relatives: Relative[];

  @OneToMany(() => CaseHistory, (history) => history.case)
  history: CaseHistory[];
  
  @OneToMany(() => CaseActivity, (activity) => activity.case)
  activities: CaseActivity[];
}