import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SurveysService } from './surveys.service';
import { SurveysSeeder } from './surveys.seeder';
import { SurveysController } from './surveys.controller';
import { Question } from './entities/question.entity';
import { SurveyResponse } from './entities/survey-response.entity';
import { DocumentsModule } from '../documents/documents.module';
import { Case } from '../cases/entities/case.entity';
import { SurveySection } from './entities/survey-section.entity';
import { SurveyOption } from './entities/survey-option.entity';
import { SurveyCondition } from './entities/survey-condition.entity';
import { Relative } from '../relatives/entities/relative.entity';
import { Document } from '../documents/entities/document.entity';
import { DocumentTypesModule } from '../document-types/document-types.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Question,
      SurveyResponse,
      Case,
      Relative,
      SurveySection,
      SurveyOption,
      SurveyCondition,
      Document
    ]),
    DocumentsModule,
    DocumentTypesModule,
  ],
  controllers: [SurveysController],
  providers: [SurveysService, SurveysSeeder],
  exports: [SurveysService]
})
export class SurveysModule { }