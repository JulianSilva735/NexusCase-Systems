import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ManualOverrideModal } from './ManualOverrideModal';
import { lifecycleApi } from '../api/lifecycleApi';
import type { CaseLifecycleSnapshot, WorkflowStage } from '../types/lifecycle';

vi.mock('../api/lifecycleApi', () => ({
  lifecycleApi: {
    getWorkflowStages: vi.fn(),
    getCaseLifecycle: vi.fn(),
    recalculateCaseLifecycle: vi.fn(),
    applyManualLifecycleOverride: vi.fn(),
    getLifecycleHistory: vi.fn(),
  },
}));

afterEach(() => {
  vi.clearAllMocks();
});

const stages: WorkflowStage[] = [
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

const successSnapshot: CaseLifecycleSnapshot = {
  current_stage: 'CONTACTADO',
  current_stage_label: 'Contactado',
  source: 'MANUAL',
  manual_override: { active: true, target_stage: 'CONTACTADO' },
  stages: [],
};

const renderModal = (onClose = vi.fn()) => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  render(
    <QueryClientProvider client={queryClient}>
      <ManualOverrideModal open onClose={onClose} caseId="case-1" workflowStages={stages} />
    </QueryClientProvider>,
  );

  return { onClose };
};

describe('ManualOverrideModal', () => {
  it('aplica override manual exitosamente', async () => {
    vi.mocked(lifecycleApi.applyManualLifecycleOverride).mockResolvedValue(successSnapshot);

    const { onClose } = renderModal();
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Etapa objetivo'), { target: { value: 'CONTACTADO' } });

    await user.type(screen.getByLabelText('Motivo'), 'Caso prioritario');
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    await waitFor(() => {
      expect(lifecycleApi.applyManualLifecycleOverride).toHaveBeenCalledWith('case-1', {
        target_stage: 'CONTACTADO',
        reason: 'Caso prioritario',
      });
    });

    expect(onClose).toHaveBeenCalled();
  });

  it('maneja 400 y permite reintento forzado', async () => {
    vi.mocked(lifecycleApi.applyManualLifecycleOverride)
      .mockRejectedValueOnce({ response: { status: 400 } })
      .mockResolvedValueOnce(successSnapshot);

    renderModal();
    const user = userEvent.setup();

    fireEvent.change(screen.getByLabelText('Etapa objetivo'), { target: { value: 'CONTACTADO' } });
    await user.click(screen.getByRole('button', { name: 'Aplicar' }));

    expect(await screen.findByText('Transicion invalida')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: 'Forzar transicion' }));

    await waitFor(() => {
      expect(lifecycleApi.applyManualLifecycleOverride).toHaveBeenLastCalledWith('case-1', {
        target_stage: 'CONTACTADO',
        reason: undefined,
        force_invalid_transition: true,
      });
    });
  });
});
