import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { Case } from '../../cases/entities/case.entity';
import { Question } from './question.entity';
import { Relative } from '../../relatives/entities/relative.entity';

@Entity('survey_responses')
export class SurveyResponse {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  value: string;

  @ManyToOne(() => Case, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'caseId' })
  case: Case;

  @ManyToOne(() => Question, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'questionId' })
  question: Question;

  @ManyToOne(() => Relative, { nullable: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'relativeId' })
  relative: Relative | null; 
}