import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, OneToMany } from 'typeorm';
import { Question } from './question.entity';
import { SurveyCondition } from './survey-condition.entity';

@Entity('survey_options')
export class SurveyOption {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    label: string;

    @Column({ type: 'text', nullable: true })
    value?: string;

    @Column({ default: 0 })
    order: number;

    @ManyToOne(() => Question, (question) => question.options, { onDelete: 'CASCADE' })
    question: Question;

    @OneToMany(() => SurveyCondition, (condition) => condition.option)
    conditions: SurveyCondition[];
}
