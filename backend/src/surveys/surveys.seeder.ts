import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SurveySection } from './entities/survey-section.entity';
import { Question } from './entities/question.entity';
import { SurveyOption } from './entities/survey-option.entity';
import { SurveyCondition } from './entities/survey-condition.entity';
import { QuestionType } from './entities/question-type.enum';

@Injectable()
export class SurveysSeeder {
    constructor(
        @InjectRepository(SurveySection)
        private readonly sectionRepository: Repository<SurveySection>,
        @InjectRepository(Question)
        private readonly questionRepository: Repository<Question>,
        @InjectRepository(SurveyOption)
        private readonly optionRepository: Repository<SurveyOption>,
        @InjectRepository(SurveyCondition)
        private readonly conditionRepository: Repository<SurveyCondition>,
    ) { }

    async seed() {
        const sectionsCount = await this.sectionRepository.count();

        if (sectionsCount > 0) {
            return; // ¡Aquí se detiene!
        }

        await this.sectionRepository.save({
            title: 'Información General y Familiar',
            order: 1,
            isActive: true,
        });
    }

    private async createOption(question: Question, label: string, order: number) {
        return this.optionRepository.save({
            label,
            order,
            question,
        });
    }

    private async createCondition(option: SurveyOption, docType: string) {
        return this.conditionRepository.save({
            option,
            requiredDocumentType: docType,
        });
    }
}