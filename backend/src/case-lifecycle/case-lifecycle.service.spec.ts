import { DataSource, Repository } from 'typeorm';
import { CaseLifecycleService } from './case-lifecycle.service';
import { Case } from '../cases/entities/case.entity';
import { CaseWorkflowStageConfig } from './entities/case-workflow-stage-config.entity';
import { CaseActivityProgress } from './entities/case-activity-progress.entity';
import { CaseLifecycleSnapshot } from './entities/case-lifecycle-snapshot.entity';
import { CaseLifecycleHistory } from './entities/case-lifecycle-history.entity';
import { Document } from '../documents/entities/document.entity';
import { Relative } from '../relatives/entities/relative.entity';
import { CaseStatus } from '../cases/entities/case.entity';

describe('CaseLifecycleService', () => {
  let service: CaseLifecycleService;

  const caseRepository = {
    findOne: jest.fn(),
    exist: jest.fn(),
  } as unknown as Repository<Case>;

  const documentRepository = {
    find: jest.fn(),
  } as unknown as Repository<Document>;

  const relativeRepository = {
    find: jest.fn(),
  } as unknown as Repository<Relative>;

  const stageConfigRepository = {
    find: jest.fn(),
    count: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(),
  } as unknown as Repository<CaseWorkflowStageConfig>;

  const activityProgressRepository = {
    find: jest.fn(),
  } as unknown as Repository<CaseActivityProgress>;

  const lifecycleSnapshotRepository = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => v),
  } as unknown as Repository<CaseLifecycleSnapshot>;

  const lifecycleHistoryRepository = {
    find: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => v),
  } as unknown as Repository<CaseLifecycleHistory>;

  const managerSnapshotRepo = {
    findOne: jest.fn(),
    save: jest.fn(),
    create: jest.fn((v) => ({ ...v })),
  };

  const managerHistoryRepo = {
    create: jest.fn((v) => v),
    save: jest.fn(),
  };

  const managerCaseRepo = {
    findOne: jest.fn(),
  };

  const dataSource = {
    transaction: jest.fn(async (handler) =>
      handler({
        getRepository: (entity: any) => {
          if (entity.name === 'Case') return managerCaseRepo;
          if (entity.name === 'CaseLifecycleSnapshot') return managerSnapshotRepo;
          if (entity.name === 'CaseLifecycleHistory') return managerHistoryRepo;
          return null;
        },
      }),
    ),
  } as unknown as DataSource;

  beforeEach(() => {
    jest.clearAllMocks();

    stageConfigRepository.find = jest.fn().mockResolvedValue([
      {
        key: 'PENDIENTE',
        label: 'Pendiente',
        order: 1,
        isTerminal: false,
        activities: [{ key: 'case_created', label: 'Caso creado', weight: 100, indicatorKey: 'case_created' }],
      },
      {
        key: 'UBICADO',
        label: 'Ubicado',
        order: 2,
        isTerminal: false,
        activities: [{ key: 'client_located', label: 'Cliente ubicado', weight: 100, indicatorKey: 'client_located' }],
      },
      {
        key: 'FINALIZADO',
        label: 'Finalizado',
        order: 10,
        isTerminal: true,
        activities: [],
      },
      {
        key: 'CANCELADO',
        label: 'Cancelado',
        order: 11,
        isTerminal: true,
        activities: [],
      },
    ]);

    service = new CaseLifecycleService(
      dataSource,
      caseRepository,
      documentRepository,
      relativeRepository,
      stageConfigRepository,
      activityProgressRepository,
      lifecycleSnapshotRepository,
      lifecycleHistoryRepository,
    );
  });

  it('recalculate es idempotente y no agrega historial si la etapa no cambia', async () => {
    const caseId = 'f31e0cf2-47ce-4b6d-b0e7-8f5077bf6990';

    caseRepository.findOne = jest.fn().mockResolvedValue({
      id: caseId,
      status: CaseStatus.NUEVO,
      clientPhone: null,
      clientEmail: null,
      clientAddress: null,
    });
    documentRepository.find = jest.fn().mockResolvedValue([]);
    relativeRepository.find = jest.fn().mockResolvedValue([]);
    activityProgressRepository.find = jest.fn().mockResolvedValue([]);
    lifecycleSnapshotRepository.findOne = jest.fn().mockResolvedValue({
      currentStage: 'UBICADO',
      manualOverrideActive: false,
      manualOverrideStage: null,
      manualOverrideReason: null,
      manualOverrideAt: null,
      manualOverrideUser: null,
    });

    managerCaseRepo.findOne = jest.fn().mockResolvedValue({ id: caseId, status: CaseStatus.NUEVO });
    managerSnapshotRepo.findOne = jest.fn().mockResolvedValue({
      currentStage: 'UBICADO',
      manualOverrideActive: false,
      manualOverrideStage: null,
      manualOverrideReason: null,
      manualOverrideAt: null,
      manualOverrideUser: null,
    });
    managerSnapshotRepo.save = jest.fn().mockImplementation(async (v) => v);

    await service.recalculate(caseId);

    expect(managerHistoryRepo.save).not.toHaveBeenCalled();
  });

  it('prioriza etapa terminal CANCELADO sobre calculo de progreso', async () => {
    const caseId = 'f31e0cf2-47ce-4b6d-b0e7-8f5077bf6990';

    caseRepository.findOne = jest.fn().mockResolvedValue({
      id: caseId,
      status: CaseStatus.CANCELADO,
      clientPhone: '300',
      clientEmail: 'x@y.com',
      clientAddress: 'dir',
    });
    documentRepository.find = jest.fn().mockResolvedValue([]);
    relativeRepository.find = jest.fn().mockResolvedValue([]);
    activityProgressRepository.find = jest.fn().mockResolvedValue([]);
    lifecycleSnapshotRepository.findOne = jest.fn().mockResolvedValue(null);

    const result = await service.getCaseLifecycle(caseId);

    expect(result.current_stage).toBe('CANCELADO');
    expect(result.source).toBe('AUTO');
  });
});
