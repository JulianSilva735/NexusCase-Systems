import { CaseLifecycleMachine } from './case-lifecycle.machine';

describe('CaseLifecycleMachine', () => {
  const machine = new CaseLifecycleMachine();

  const stages = [
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
      key: 'CONTACTADO',
      label: 'Contactado',
      order: 3,
      isTerminal: false,
      activities: [{ key: 'first_contact_done', label: 'Primer contacto', weight: 100, indicatorKey: 'first_contact_done' }],
    },
  ];

  it('calcula etapa actual como la primera incompleta', () => {
    const result = machine.compute({
      stages,
      activityCompletion: new Map<string, boolean>(),
      indicators: {
        case_created: true,
        client_located: true,
        first_contact_done: false,
      },
    });

    expect(result.autoCurrentStageKey).toBe('CONTACTADO');
    expect(result.stageProgress.find((s) => s.key === 'PENDIENTE')?.progress).toBe(100);
    expect(result.stageProgress.find((s) => s.key === 'CONTACTADO')?.progress).toBe(0);
  });

  it('usa progreso manual de actividad cuando no hay indicador', () => {
    const result = machine.compute({
      stages: [
        {
          key: 'X',
          label: 'X',
          order: 1,
          isTerminal: false,
          activities: [
            { key: 'a', label: 'A', weight: 70 },
            { key: 'b', label: 'B', weight: 30 },
          ],
        },
      ],
      activityCompletion: new Map<string, boolean>([['a', true]]),
      indicators: {},
    });

    expect(result.stageProgress[0].progress).toBe(70);
    expect(result.autoCurrentStageKey).toBe('X');
  });

  it('si todas estan completas queda en la ultima etapa', () => {
    const result = machine.compute({
      stages,
      activityCompletion: new Map<string, boolean>(),
      indicators: {
        case_created: true,
        client_located: true,
        first_contact_done: true,
      },
    });

    expect(result.autoCurrentStageKey).toBe('CONTACTADO');
    expect(result.stageProgress.every((stage) => stage.progress === 100)).toBe(true);
  });
});
