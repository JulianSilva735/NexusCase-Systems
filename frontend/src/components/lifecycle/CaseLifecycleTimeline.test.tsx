import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { CaseLifecycleTimeline } from './CaseLifecycleTimeline';
import type { CaseLifecycleSnapshot, WorkflowStage } from '../../types/lifecycle';

const workflowStages: WorkflowStage[] = [
  {
    key: 'PENDIENTE',
    label: 'Pendiente',
    order: 1,
    activities: [],
    is_terminal: false,
  },
  {
    key: 'CONTACTADO',
    label: 'Contactado',
    order: 2,
    activities: [],
    is_terminal: false,
  },
];

const lifecycle: CaseLifecycleSnapshot = {
  current_stage: 'CONTACTADO',
  current_stage_label: 'Contactado',
  source: 'MANUAL',
  manual_override: {
    active: true,
    target_stage: 'CONTACTADO',
    reason: 'Ajuste operativo',
    user_id: 'user-1',
    changed_at: '2026-03-15T10:00:00.000Z',
  },
  stages: [
    {
      key: 'PENDIENTE',
      label: 'Pendiente',
      progress: 100,
      completed_activities: 1,
      total_activities: 1,
      status: 'completed',
    },
    {
      key: 'CONTACTADO',
      label: 'Contactado',
      progress: 50,
      completed_activities: 1,
      total_activities: 2,
      status: 'current',
    },
  ],
};

describe('CaseLifecycleTimeline', () => {
  it('renderiza solo tarjetas de etapa ordenadas', () => {
    render(
      <CaseLifecycleTimeline
        workflowStages={workflowStages}
        lifecycle={lifecycle}
      />
    );

    expect(screen.getByText('Lifecycle del Caso')).toBeInTheDocument();
    expect(screen.getByText('Pendiente')).toBeInTheDocument();
    expect(screen.getByText('Contactado')).toBeInTheDocument();
  });
});
