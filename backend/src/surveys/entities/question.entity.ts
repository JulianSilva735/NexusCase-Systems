import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, UpdateDateColumn, ManyToOne, OneToMany, JoinColumn, ManyToMany, JoinTable } from 'typeorm';
import { QuestionType } from './question-type.enum';
import { SurveySection } from './survey-section.entity';
import { SurveyOption } from './survey-option.entity';
import { DocumentType } from '../../document-types/entities/document-type.entity';

@Entity('questions')
export class Question {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'text' })
  statement: string; // The question text

  @Column({ type: 'int', default: 0 })
  order: number;

  @Column({
    type: 'varchar',
    enum: QuestionType,
    default: QuestionType.OPEN_TEXT
  })
  type: QuestionType;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'boolean', default: false })
  isRequired: boolean;

  @ManyToOne(() => SurveySection, (section) => section.questions, { nullable: true })
  @JoinColumn({ name: 'section_id' })
  section: SurveySection;

  @OneToMany(() => SurveyOption, (option) => option.question, { cascade: true })
  options: SurveyOption[];

  @Column({ type: 'uuid', name: 'activation_option_id', nullable: true })
  activationOptionId: string | null;

  @ManyToOne(() => SurveyOption, { nullable: true })
  @JoinColumn({ name: 'activation_option_id' })
  activationOption: SurveyOption;

  @ManyToOne(() => Question, { nullable: true })
  @JoinColumn({ name: 'parent_question_id' })
  parentQuestion: Question;

  @ManyToMany(() => DocumentType)
  @JoinTable({ name: 'question_required_documents' })
  requiredDocumentTypes: DocumentType[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
