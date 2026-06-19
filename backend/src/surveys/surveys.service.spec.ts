import { SurveysService } from './surveys.service';

describe('SurveysService (unit) - mapping', () => {
  let service: SurveysService;

  beforeEach(() => {
    // Minimal service instance to access mapInputType
    service = new SurveysService(null as any, null as any, null as any, null as any, null as any, null as any, null as any, null as any);
  });

  it('maps BOOLEAN to YES_NO', () => {
    const mapped = (service as any).mapInputType('BOOLEAN');
    expect(mapped).toBeDefined();
    expect(mapped).toBe('YES_NO');
  });

  it('keeps OPEN_TEXT', () => {
    const mapped = (service as any).mapInputType('OPEN_TEXT');
    expect(mapped).toBe('OPEN_TEXT');
  });
});
