import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Case } from '../../cases/entities/case.entity';
import { Question } from './question.entity';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' }) 
  value: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @ManyToOne(() => Question, { eager: true })
  @JoinColumn({ name: 'questionId' })
  question: Question;
}