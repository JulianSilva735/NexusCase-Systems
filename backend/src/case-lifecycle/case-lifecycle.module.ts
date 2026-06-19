import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Case } from '../cases/entities/case.entity';
import { Document } from '../documents/entities/document.entity';
import { Relative } from '../relatives/entities/relative.entity';
import { CaseLifecycleService } from './case-lifecycle.service';
import { CaseLifecycleController } from './case-lifecycle.controller';
import { WorkflowController } from './workflow.controller';
import { CaseWorkflowStageConfig } from './entities/case-workflow-stage-config.entity';
import { CaseActivityProgress } from './entities/case-activity-progress.entity';
import { CaseLifecycleSnapshot } from './entities/case-lifecycle-snapshot.entity';
import { CaseLifecycleHistory } from './entities/case-lifecycle-history.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Case,
      Document,
      Relative,
      CaseWorkflowStageConfig,
      CaseActivityProgress,
      CaseLifecycleSnapshot,
      CaseLifecycleHistory,
    ]),
  ],
  controllers: [CaseLifecycleController, WorkflowController],
  providers: [CaseLifecycleService],
  exports: [CaseLifecycleService],
})
export class CaseLifecycleModule {}
