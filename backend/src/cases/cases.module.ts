import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CasesService } from './cases.service';
import { CasesController } from './cases.controller';

import { Case } from './entities/case.entity';
import { CaseHistory } from './entities/case-history.entity';
import { Relative } from '../relatives/entities/relative.entity';
import { Document } from '../documents/entities/document.entity';
import { CaseActivity } from './entities/case-activity.entity';
import { CaseState } from './entities/case-state.entity';

import { RelativesModule } from '../relatives/relatives.module';
import { DocumentsModule } from '../documents/documents.module';
import { SurveysModule } from '../surveys/surveys.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Case, CaseHistory, Relative, Document, CaseActivity, CaseState]),
    RelativesModule,
    DocumentsModule,
    SurveysModule
  ],
  controllers: [CasesController],
  providers: [CasesService],
  exports: [CasesService]
})
export class CasesModule { }