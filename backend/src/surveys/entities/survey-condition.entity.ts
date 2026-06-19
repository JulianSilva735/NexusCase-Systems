import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { SurveyOption } from './survey-option.entity';

@Entity('survey_conditions')
export class SurveyCondition {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @ManyToOne(() => SurveyOption, (option) => option.conditions, { onDelete: 'CASCADE' })
    option: SurveyOption;

    @Column()
    requiredDocumentType: string;
}
