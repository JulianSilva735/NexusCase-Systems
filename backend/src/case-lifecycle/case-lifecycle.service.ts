import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Case, CaseStatus } from '../cases/entities/case.entity';
import { Document } from '../documents/entities/document.entity';
import { Relative } from '../relatives/entities/relative.entity';
import { CaseWorkflowStageConfig } from './entities/case-workflow-stage-config.entity';
import { CaseActivityProgress } from './entities/case-activity-progress.entity';
import { CaseLifecycleSnapshot } from './entities/case-lifecycle-snapshot.entity';
import { CaseLifecycleHistory } from './entities/case-lifecycle-history.entity';
import {
  DEFAULT_WORKFLOW_STAGE_CONFIG,
  LIFECYCLE_STAGE_SEQUENCE,
  LifecycleSource,
  LifecycleStageKey,
  VALID_AUTOMATIC_FORWARD_TRANSITIONS,
} from './case-lifecycle.constants';
import {
  CaseLifecycleMachine,
  StageComputedProgress,
  StageRule,
} from './case-lifecycle.machine';
import { DocumentStatus } from '../documents/entities/document-status.enum';
import { User, UserRole } from '../users/entities/user.entity';
import { ManualLifecycleOverrideDto } from './dto/manual-override.dto';
import { LifecycleHistoryResponseDto } from './dto/lifecycle-history-response.dto';

export interface StageResponse {
  key: string;
  label: string;
  order: number;
  activities: Array<{ key: string; label: string; weight: number; indicatorKey?: string }>;
  is_terminal: boolean;
}

export interface LifecycleResponse {
  current_stage: string;
  current_stage_label: string;
  stages: Array<{
    key: string;
    label: string;
    progress: number;
    completed_activities: number;
    total_activities: number;
    status: 'completed' | 'current' | 'pending';
  }>;
  source: LifecycleSource;
  manual_override: {
    active: boolean;
    target_stage: string | null;
    reason: string | null;
    user_id: string | null;
    changed_at: string | null;
  };
}

@Injectable()
export class CaseLifecycleService implements OnModuleInit {
  private readonly machine = new CaseLifecycleMachine();

  constructor(
    private readonly dataSource: DataSource,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Relative)
    private readonly relativeRepository: Repository<Relative>,
    @InjectRepository(CaseWorkflowStageConfig)
    private readonly stageConfigRepository: Repository<CaseWorkflowStageConfig>,
    @InjectRepository(CaseActivityProgress)
    private readonly activityProgressRepository: Repository<CaseActivityProgress>,
    @InjectRepository(CaseLifecycleSnapshot)
    private readonly lifecycleSnapshotRepository: Repository<CaseLifecycleSnapshot>,
    @InjectRepository(CaseLifecycleHistory)
    private readonly lifecycleHistoryRepository: Repository<CaseLifecycleHistory>,
  ) {}

  async onModuleInit(): Promise<void> {
    await this.seedWorkflowStages();
  }

  async getWorkflowStages(): Promise<StageResponse[]> {
    const configs = await this.getOrderedStageConfigs();
    return configs.map((stage) => ({
      key: stage.key,
      label: stage.label,
      order: stage.order,
      activities: stage.activities,
      is_terminal: stage.isTerminal,
    }));
  }

  async getCaseLifecycle(caseId: string): Promise<LifecycleResponse> {
    const { resolvedStageKey, resolvedStageLabel, source, stageProgress, snapshot } =
      await this.resolveLifecycle(caseId);

    return this.buildLifecycleResponse(
      resolvedStageKey,
      resolvedStageLabel,
      source,
      stageProgress,
      snapshot,
    );
  }

  async recalculate(caseId: string, actor?: User): Promise<LifecycleResponse> {
    const result = await this.dataSource.transaction(async (manager) => {
      const casesRepo = manager.getRepository(Case);
      const snapshotRepo = manager.getRepository(CaseLifecycleSnapshot);
      const historyRepo = manager.getRepository(CaseLifecycleHistory);

      const caseEntity = await casesRepo.findOne({
        where: { id: caseId },
      });

      if (!caseEntity) {
        throw new NotFoundException('Caso no encontrado');
      }

      const existingSnapshot = await snapshotRepo.findOne({
        where: { case: { id: caseId } },
        relations: { manualOverrideUser: true },
      });

      const resolved = await this.resolveLifecycle(caseId);

      const previousStage = existingSnapshot?.currentStage ?? null;
      const stageChanged = previousStage !== resolved.resolvedStageKey;

      const nextSnapshot = existingSnapshot
        ? existingSnapshot
        : snapshotRepo.create({ case: { id: caseId } as Case });

      nextSnapshot.currentStage = resolved.resolvedStageKey;
      nextSnapshot.currentStageLabel = resolved.resolvedStageLabel;
      nextSnapshot.autoStage = resolved.autoStageKey;
      nextSnapshot.source = resolved.source;
      nextSnapshot.lastRecalculatedAt = new Date();

      if (
        resolved.terminalForced ||
        (nextSnapshot.manualOverrideActive && nextSnapshot.manualOverrideStage === null)
      ) {
        nextSnapshot.manualOverrideActive = false;
        nextSnapshot.manualOverrideStage = null;
        nextSnapshot.manualOverrideReason = null;
        nextSnapshot.manualOverrideAt = null;
        nextSnapshot.manualOverrideUser = null;
      }

      const savedSnapshot = await snapshotRepo.save(nextSnapshot);

      if (stageChanged) {
        const newHistory = historyRepo.create({
          case: { id: caseId } as Case,
          fromStage: previousStage,
          toStage: resolved.resolvedStageKey,
          source: resolved.source,
          reason: resolved.source === LifecycleSource.AUTO ? 'Recalculo de lifecycle' : savedSnapshot.manualOverrideReason,
          user: actor ? ({ id: actor.id } as User) : null,
        });
        await historyRepo.save(newHistory);
      }

      return this.buildLifecycleResponse(
        resolved.resolvedStageKey,
        resolved.resolvedStageLabel,
        resolved.source,
        resolved.stageProgress,
        savedSnapshot,
      );
    });

    return result;
  }

  async applyManualOverride(caseId: string, dto: ManualLifecycleOverrideDto, actor: User): Promise<LifecycleResponse> {
    this.assertCanOverride(actor);

    const { normalizedTarget, isReset } = this.normalizeManualTarget(dto.target_stage);

    const result = await this.dataSource.transaction(async (manager) => {
      const casesRepo = manager.getRepository(Case);
      const snapshotRepo = manager.getRepository(CaseLifecycleSnapshot);
      const historyRepo = manager.getRepository(CaseLifecycleHistory);

      const caseEntity = await casesRepo.findOne({ where: { id: caseId } });
      if (!caseEntity) {
        throw new NotFoundException('Caso no encontrado');
      }

      if (caseEntity.status === CaseStatus.FINALIZADO || caseEntity.status === CaseStatus.CANCELADO) {
        throw new BadRequestException('No se puede aplicar override manual en casos terminales');
      }

      const stageConfigs = await this.getOrderedStageConfigs();
      if (!isReset && !stageConfigs.some((stage) => stage.key === normalizedTarget)) {
        throw new BadRequestException(`Etapa objetivo invalida: ${normalizedTarget}`);
      }

      const stageByOrder = stageConfigs.reduce<Record<string, number>>((acc, stage) => {
        acc[stage.key] = stage.order;
        return acc;
      }, {});

      const lifecycle = await this.resolveLifecycle(caseId);
      if (!isReset && stageByOrder[normalizedTarget] < stageByOrder[lifecycle.autoStageKey]) {
        throw new BadRequestException('No se permiten retrocesos manuales por debajo de la etapa auto-calculada');
      }

      if (!isReset) {
        this.assertValidManualTransition(
          lifecycle.resolvedStageKey,
          normalizedTarget,
          Boolean(dto.force_invalid_transition),
        );
      }

      const snapshot =
        (await snapshotRepo.findOne({
          where: { case: { id: caseId } },
          relations: { manualOverrideUser: true },
        })) ?? snapshotRepo.create({ case: { id: caseId } as Case });

      const previousStage = snapshot.currentStage ?? lifecycle.resolvedStageKey;

      if (isReset) {
        snapshot.manualOverrideActive = false;
        snapshot.manualOverrideStage = null;
        snapshot.manualOverrideReason = dto.reason ?? null;
        snapshot.manualOverrideAt = new Date();
        snapshot.manualOverrideUser = { id: actor.id } as User;
        snapshot.source = LifecycleSource.AUTO;
      } else {
        snapshot.manualOverrideActive = true;
        snapshot.manualOverrideStage = normalizedTarget;
        snapshot.manualOverrideReason = dto.reason ?? null;
        snapshot.manualOverrideAt = new Date();
        snapshot.manualOverrideUser = { id: actor.id } as User;
        snapshot.source = LifecycleSource.MANUAL;
      }

      await snapshotRepo.save(snapshot);

      const refreshedLifecycle = await this.resolveLifecycle(caseId);
      snapshot.currentStage = refreshedLifecycle.resolvedStageKey;
      snapshot.currentStageLabel = refreshedLifecycle.resolvedStageLabel;
      snapshot.autoStage = refreshedLifecycle.autoStageKey;
      snapshot.lastRecalculatedAt = new Date();

      const savedSnapshot = await snapshotRepo.save(snapshot);

      if (savedSnapshot.currentStage !== previousStage) {
        const history = historyRepo.create({
          case: { id: caseId } as Case,
          fromStage: previousStage,
          toStage: savedSnapshot.currentStage,
          source: savedSnapshot.source,
          reason: dto.reason ?? (isReset ? 'Se desactivo override manual' : null),
          user: { id: actor.id } as User,
        });
        await historyRepo.save(history);
      }

      return this.buildLifecycleResponse(
        savedSnapshot.currentStage,
        savedSnapshot.currentStageLabel,
        savedSnapshot.source,
        refreshedLifecycle.stageProgress,
        savedSnapshot,
      );
    });

    return result;
  }

  async getLifecycleHistory(caseId: string): Promise<LifecycleHistoryResponseDto[]> {
    const caseExists = await this.caseRepository.exist({ where: { id: caseId } });
    if (!caseExists) {
      throw new NotFoundException('Caso no encontrado');
    }

    const history = await this.lifecycleHistoryRepository.find({
      where: { case: { id: caseId } },
      relations: { user: true },
      order: { changedAt: 'ASC' },
    });

    return history.map((entry) => ({
      id: entry.id,
      from_stage: entry.fromStage,
      to_stage: entry.toStage,
      source: entry.source,
      reason: entry.reason,
      user_id: entry.user?.id ?? null,
      changed_at: entry.changedAt.toISOString(),
    }));
  }

  private async resolveLifecycle(caseId: string): Promise<{
    resolvedStageKey: string;
    resolvedStageLabel: string;
    source: LifecycleSource;
    autoStageKey: string;
    stageProgress: StageComputedProgress[];
    snapshot: CaseLifecycleSnapshot | null;
    terminalForced: boolean;
  }> {
    const [caseEntity, stageConfigs, activityEntries, snapshot, allDocuments, relatives] = await Promise.all([
      this.caseRepository.findOne({ where: { id: caseId } }),
      this.getOrderedStageConfigs(),
      this.activityProgressRepository.find({ where: { case: { id: caseId } } }),
      this.lifecycleSnapshotRepository.findOne({
        where: { case: { id: caseId } },
        relations: { manualOverrideUser: true },
      }),
      this.documentRepository.find({ where: { case: { id: caseId } } }),
      this.relativeRepository.find({ where: { case: { id: caseId } } }),
    ]);

    if (!caseEntity) {
      throw new NotFoundException('Caso no encontrado');
    }

    const activityCompletion = new Map<string, boolean>();
    for (const activity of activityEntries) {
      activityCompletion.set(activity.activityKey, activity.isCompleted);
    }

    const indicators = this.buildIndicators(caseEntity, allDocuments, relatives, activityCompletion);

    const machineResult = this.machine.compute({
      stages: stageConfigs,
      activityCompletion,
      indicators,
    });

    const terminalStage = this.resolveTerminalStage(caseEntity.status, stageConfigs);
    if (terminalStage) {
      return {
        resolvedStageKey: terminalStage.key,
        resolvedStageLabel: terminalStage.label,
        source: LifecycleSource.AUTO,
        autoStageKey: terminalStage.key,
        stageProgress: machineResult.stageProgress.map((stage) =>
          stage.key === terminalStage.key
            ? { ...stage, progress: 100 }
            : stage.key === LifecycleStageKey.CANCELADO || stage.key === LifecycleStageKey.FINALIZADO
              ? { ...stage, progress: 0 }
              : stage,
        ),
        snapshot,
        terminalForced: true,
      };
    }

    const manualOverrideActive = snapshot?.manualOverrideActive && snapshot?.manualOverrideStage;
    if (manualOverrideActive) {
      const manualStage = stageConfigs.find((stage) => stage.key === snapshot.manualOverrideStage);
      if (!manualStage) {
        throw new BadRequestException('Override manual referencia una etapa inexistente');
      }

      return {
        resolvedStageKey: manualStage.key,
        resolvedStageLabel: manualStage.label,
        source: LifecycleSource.MANUAL,
        autoStageKey: machineResult.autoCurrentStageKey,
        stageProgress: machineResult.stageProgress,
        snapshot,
        terminalForced: false,
      };
    }

    return {
      resolvedStageKey: machineResult.autoCurrentStageKey,
      resolvedStageLabel: machineResult.autoCurrentStageLabel,
      source: LifecycleSource.AUTO,
      autoStageKey: machineResult.autoCurrentStageKey,
      stageProgress: machineResult.stageProgress,
      snapshot,
      terminalForced: false,
    };
  }

  private buildLifecycleResponse(
    currentStage: string,
    currentStageLabel: string,
    source: LifecycleSource,
    stageProgress: StageComputedProgress[],
    snapshot: CaseLifecycleSnapshot | null,
  ): LifecycleResponse {
    const currentOrder =
      stageProgress.find((stage) => stage.key === currentStage)?.key ?? currentStage;

    const stages = stageProgress.map((stage) => ({
      key: stage.key,
      label: stage.label,
      progress: stage.progress,
      completed_activities: stage.completedActivities,
      total_activities: stage.totalActivities,
      status: this.resolveStageStatus(stageProgress, currentOrder, stage),
    }));

    return {
      current_stage: currentStage,
      current_stage_label: currentStageLabel,
      stages,
      source,
      manual_override: {
        active: snapshot?.manualOverrideActive ?? false,
        target_stage: snapshot?.manualOverrideStage ?? null,
        reason: snapshot?.manualOverrideReason ?? null,
        user_id: snapshot?.manualOverrideUser?.id ?? null,
        changed_at: snapshot?.manualOverrideAt ? snapshot.manualOverrideAt.toISOString() : null,
      },
    };
  }

  private resolveStageStatus(
    orderedStages: StageComputedProgress[],
    currentStageKey: string,
    candidate: StageComputedProgress,
  ): 'completed' | 'current' | 'pending' {
    const currentIndex = orderedStages.findIndex((stage) => stage.key === currentStageKey);
    const candidateIndex = orderedStages.findIndex((stage) => stage.key === candidate.key);

    if (candidateIndex < currentIndex) {
      return 'completed';
    }

    if (candidateIndex === currentIndex) {
      return 'current';
    }

    return 'pending';
  }

  private buildIndicators(
    caseEntity: Case,
    documents: Array<{ name: string; status: DocumentStatus }>,
    relatives: Relative[],
    activityCompletion: Map<string, boolean>,
  ): Record<string, boolean> {
    const hasClientContactInfo = Boolean(
      caseEntity.clientPhone || caseEntity.clientEmail || caseEntity.clientAddress,
    );
    const allDocumentsApproved =
      documents.length > 0 && documents.every((doc) => doc.status === DocumentStatus.APPROVED);

    const activityDone = (activityKey: string): boolean =>
      Boolean(activityCompletion.get(activityKey));

    return {
      case_created: true,
      client_located: hasClientContactInfo || relatives.length > 0 || activityDone('client_located'),
      first_contact_done: activityDone('first_contact_done'),
      contract_sent: activityDone('contract_sent'),
      contract_signed: activityDone('contract_signed'),
      documents_ready: allDocumentsApproved || activityDone('documents_ready'),
      entity_filed: activityDone('entity_filed'),
      case_updated: activityDone('case_updated'),
      payment_confirmed: activityDone('payment_confirmed'),
    };
  }

  private normalizeManualTarget(targetStage: string): { normalizedTarget: string; isReset: boolean } {
    const normalizedTarget = targetStage.trim().toUpperCase();
    const isReset = normalizedTarget === 'AUTO';
    return { normalizedTarget, isReset };
  }

  private assertValidManualTransition(
    currentStage: string,
    targetStage: string,
    forceInvalidTransition: boolean,
  ): void {
    if (currentStage === targetStage) {
      return;
    }

    const allowed = VALID_AUTOMATIC_FORWARD_TRANSITIONS[currentStage] ?? [];
    const isConsecutiveForward = allowed.includes(targetStage);

    if (isConsecutiveForward) {
      return;
    }

    const currentIdx = LIFECYCLE_STAGE_SEQUENCE.indexOf(currentStage as LifecycleStageKey);
    const targetIdx = LIFECYCLE_STAGE_SEQUENCE.indexOf(targetStage as LifecycleStageKey);
    const isForwardJump = currentIdx >= 0 && targetIdx > currentIdx;

    if (isForwardJump && forceInvalidTransition) {
      return;
    }

    if (isForwardJump && !forceInvalidTransition) {
      throw new BadRequestException(
        'Salto manual invalido. Use force_invalid_transition=true para override admin explicito.',
      );
    }

    throw new BadRequestException('Transicion manual invalida para el ciclo de vida del caso');
  }

  private assertCanOverride(user: User): void {
    const roles = user.roles ?? [];
    const authorized =
      roles.includes(UserRole.ADMINISTRADOR) || roles.includes(UserRole.SUPERVISOR);

    if (!authorized) {
      throw new ForbiddenException('Solo admin o supervisor pueden aplicar override manual');
    }
  }

  private resolveTerminalStage(status: CaseStatus, stages: StageRule[]): StageRule | null {
    if (status === CaseStatus.FINALIZADO) {
      return stages.find((stage) => stage.key === LifecycleStageKey.FINALIZADO) ?? null;
    }

    if (status === CaseStatus.CANCELADO) {
      return stages.find((stage) => stage.key === LifecycleStageKey.CANCELADO) ?? null;
    }

    return null;
  }

  private async getOrderedStageConfigs(): Promise<StageRule[]> {
    const configs = await this.stageConfigRepository.find({
      order: { order: 'ASC' },
    });

    return configs.map((config) => ({
      key: config.key,
      label: config.label,
      order: config.order,
      isTerminal: config.isTerminal,
      activities: config.activities ?? [],
    }));
  }

  private async seedWorkflowStages(): Promise<void> {
    const count = await this.stageConfigRepository.count();
    if (count > 0) {
      return;
    }

    const seedEntities = DEFAULT_WORKFLOW_STAGE_CONFIG.map((stage) =>
      this.stageConfigRepository.create({
        key: stage.key,
        label: stage.label,
        order: stage.order,
        isTerminal: stage.isTerminal,
        activities: stage.activities,
      }),
    );

    await this.stageConfigRepository.save(seedEntities);
  }
}
