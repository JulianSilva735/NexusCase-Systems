import { SurveysController } from './surveys.controller';

describe('SurveysController lifecycle auto recalculate', () => {
  const surveysService = {
    submitResponses: jest.fn(),
    createSection: jest.fn(),
    findAll: jest.fn(),
    findOne: jest.fn(),
    createQuestion: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
    updateStructure: jest.fn(),
  };

  const surveysSeeder = {
    seed: jest.fn(),
  };

  const lifecycleService = {
    recalculate: jest.fn(),
  };

  let controller: SurveysController;

  beforeEach(() => {
    jest.clearAllMocks();
    controller = new SurveysController(
      surveysService as any,
      surveysSeeder as any,
      lifecycleService as any,
    );
  });

  it('recalcula lifecycle al guardar respuestas de encuesta', async () => {
    surveysService.submitResponses.mockResolvedValue({ count: 1 });

    await controller.submitResponses(
      'case-1',
      { responses: [{ questionId: 'q1', value: true }] } as any,
      { user: { id: 'u1' } } as any,
    );

    expect(lifecycleService.recalculate).toHaveBeenCalledWith('case-1', { id: 'u1' });
  });
});
