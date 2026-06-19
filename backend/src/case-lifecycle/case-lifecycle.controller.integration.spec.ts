import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import * as request from 'supertest';
import { CaseLifecycleController } from './case-lifecycle.controller';
import { WorkflowController } from './workflow.controller';
import { CaseLifecycleService } from './case-lifecycle.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';

describe('CaseLifecycle API Integration', () => {
  let app: INestApplication;

  const lifecycleMock = {
    getWorkflowStages: jest.fn().mockResolvedValue([
      { key: 'PENDIENTE', label: 'Pendiente', order: 1, activities: [], is_terminal: false },
    ]),
    getCaseLifecycle: jest.fn().mockResolvedValue({
      current_stage: 'PENDIENTE',
      current_stage_label: 'Pendiente',
      stages: [],
      source: 'AUTO',
      manual_override: {
        active: false,
        target_stage: null,
        reason: null,
        user_id: null,
        changed_at: null,
      },
    }),
    recalculate: jest.fn().mockResolvedValue({ current_stage: 'UBICADO' }),
    applyManualOverride: jest.fn().mockResolvedValue({ current_stage: 'CONTRATO_FIRMADO' }),
    getLifecycleHistory: jest.fn().mockResolvedValue([]),
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CaseLifecycleController, WorkflowController],
      providers: [{ provide: CaseLifecycleService, useValue: lifecycleMock }],
    })
      .overrideGuard(JwtAuthGuard)
      .useValue({ canActivate: () => true })
      .overrideGuard(PermissionsGuard)
      .useValue({ canActivate: () => true })
      .compile();

    app = moduleFixture.createNestApplication();
    app.setGlobalPrefix('api');
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /api/workflow/stages', async () => {
    await request(app.getHttpServer())
      .get('/api/workflow/stages')
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
        expect(body[0].key).toBe('PENDIENTE');
      });
  });

  it('GET /api/cases/:caseId/lifecycle', async () => {
    const caseId = '1f6cd1dd-4f37-4ec5-a2f8-55ab74ea68b3';

    await request(app.getHttpServer())
      .get(`/api/cases/${caseId}/lifecycle`)
      .expect(200)
      .expect(({ body }) => {
        expect(body.current_stage).toBeDefined();
      });
  });

  it('POST /api/cases/:caseId/lifecycle/recalculate', async () => {
    const caseId = '1f6cd1dd-4f37-4ec5-a2f8-55ab74ea68b3';

    await request(app.getHttpServer())
      .post(`/api/cases/${caseId}/lifecycle/recalculate`)
      .expect(201)
      .expect(({ body }) => {
        expect(body.current_stage).toBe('UBICADO');
      });
  });

  it('PATCH /api/cases/:caseId/lifecycle/manual', async () => {
    const caseId = '1f6cd1dd-4f37-4ec5-a2f8-55ab74ea68b3';

    await request(app.getHttpServer())
      .patch(`/api/cases/${caseId}/lifecycle/manual`)
      .send({ target_stage: 'CONTRATO_FIRMADO', reason: 'Validado por supervisor', force_invalid_transition: true })
      .expect(200)
      .expect(({ body }) => {
        expect(body.current_stage).toBe('CONTRATO_FIRMADO');
      });
  });

  it('GET /api/cases/:caseId/lifecycle/history', async () => {
    const caseId = '1f6cd1dd-4f37-4ec5-a2f8-55ab74ea68b3';

    await request(app.getHttpServer())
      .get(`/api/cases/${caseId}/lifecycle/history`)
      .expect(200)
      .expect(({ body }) => {
        expect(Array.isArray(body)).toBe(true);
      });
  });
});
