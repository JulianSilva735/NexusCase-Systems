import { Entity, PrimaryGeneratedColumn, Column, OneToMany } from 'typeorm';
import { Question } from './question.entity';

@Entity('survey_sections')
export class SurveySection {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column({ type: 'text', nullable: true })
    description?: string;

    @Column({ default: 0 })
    order: number;

    @Column({ default: true })
    isActive: boolean;

    @OneToMany(() => Question, (question) => question.section)
    questions: Question[];
}
