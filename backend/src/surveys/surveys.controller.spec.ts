import { SurveysController } from './surveys.controller';
import { SurveysService } from './surveys.service';

describe('SurveysController (unit)', () => {
  let controller: SurveysController;
  let service: Partial<SurveysService>;

  beforeEach(() => {
    service = {
      createSection: jest.fn().mockResolvedValue({ id: 'section-1', title: 'S1' }),
      deleteQuestion: jest.fn().mockResolvedValue({ deleted: true }),
    };
    controller = new SurveysController(service as SurveysService, null as any);
  });

  it('creates a section and returns result', async () => {
    const dto = { title: 'Test', order: 1 };
    const res = await controller.createSection(dto as any);
    expect(res).toEqual({ id: 'section-1', title: 'S1' });
    expect((service.createSection as jest.Mock).mock.calls.length).toBe(1);
  });

  it('deletes question', async () => {
    const res = await controller.deleteQuestion('q-1');
    // controller decorated with HttpCode(204) but function returns service result
    expect(res).toEqual({ deleted: true });
    expect((service.deleteQuestion as jest.Mock).mock.calls.length).toBe(1);
  });
});
