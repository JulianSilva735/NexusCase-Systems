import { Repository } from 'typeorm';
import { CasesService } from './cases.service';
import { Case, CaseStatus } from './entities/case.entity';
import { CaseHistory } from './entities/case-history.entity';
import { CaseActivityProgress } from '../case-lifecycle/entities/case-activity-progress.entity';
import { CaseState } from './entities/case-state.entity';

describe('CasesService lifecycle auto recalculate', () => {
  let service: CasesService;

  const casesRepository = {
    findOneBy: jest.fn(),
    findOne: jest.fn(),
    save: jest.fn(),
  } as unknown as Repository<Case>;

  const historyRepository = {
    create: jest.fn((v) => v),
    save: jest.fn(),
  } as unknown as Repository<CaseHistory>;

  const activityRepository = {
    findOne: jest.fn(),
    create: jest.fn((v) => v),
    save: jest.fn(),
  } as unknown as Repository<CaseActivityProgress>;

  const stateRepository = {
    count: jest.fn().mockResolvedValue(1),
  } as unknown as Repository<CaseState>;

  const relativesService = {
    create: jest.fn(),
    remove: jest.fn(),
    update: jest.fn(),
  };

  const documentsService = {
    registerUploadedDocument: jest.fn(),
  };

  const surveysService = {
    submitResponses: jest.fn(),
    evaluateRequirements: jest.fn(),
  };

  const lifecycleService = {
    recalculate: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();

    service = new CasesService(
      casesRepository,
      historyRepository,
      relativesService as any,
      documentsService as any,
      surveysService as any,
      lifecycleService as any,
      activityRepository,
      stateRepository,
    );

    jest.spyOn(service, 'findOne').mockResolvedValue({
      id: 'case-1',
      status: CaseStatus.NUEVO,
      documents: [],
      caseCode: 'C-1',
    } as any);
  });

  it('recalcula lifecycle al actualizar checklist', async () => {
    casesRepository.findOneBy = jest.fn().mockResolvedValue({ id: 'case-1' });
    activityRepository.findOne = jest.fn().mockResolvedValue(null);
    activityRepository.save = jest.fn().mockResolvedValue({ id: 'a1' });

    await service.updateChecklistActivity('case-1', 'client_located', true, { id: 'u1' } as any);

    expect(lifecycleService.recalculate).toHaveBeenCalledWith('case-1', { id: 'u1' });
  });

  it('recalcula lifecycle al agregar familiar', async () => {
    relativesService.create = jest.fn().mockResolvedValue({ id: 'r1' });

    await service.addRelative('case-1', { firstName: 'Juan' });

    expect(lifecycleService.recalculate).toHaveBeenCalledWith('case-1');
  });

  it('recalcula lifecycle al cancelar caso', async () => {
    casesRepository.save = jest.fn().mockResolvedValue({ id: 'case-1', status: CaseStatus.CANCELADO });

    await service.cancelCase('case-1', 'Motivo', { id: 'u1' } as any);

    expect(lifecycleService.recalculate).toHaveBeenCalledWith('case-1', { id: 'u1' });
  });
});
