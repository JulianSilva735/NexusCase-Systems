import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { renderHook, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import {
  useCaseLifecycle,
  useLifecycleHistory,
  useManualLifecycleOverride,
  useWorkflowStages,
} from './useLifecycle';
import { lifecycleApi } from '../api/lifecycleApi';
import type {
  CaseLifecycleSnapshot,
  LifecycleHistoryItem,
  WorkflowStage,
} from '../types/lifecycle';

vi.mock('../api/lifecycleApi', () => ({
  lifecycleApi: {
    getWorkflowStages: vi.fn(),
    getCaseLifecycle: vi.fn(),
    recalculateCaseLifecycle: vi.fn(),
    applyManualLifecycleOverride: vi.fn(),
    getLifecycleHistory: vi.fn(),
  },
}));

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
      mutations: { retry: false },
    },
  });

  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
};

afterEach(() => {
  vi.clearAllMocks();
});

describe('useLifecycle hooks', () => {
  it('useWorkflowStages devuelve etapas ordenadas por order', async () => {
    const unsorted: WorkflowStage[] = [
      { key: 'B', label: 'B', order: 2, activities: [], is_terminal: false },
      { key: 'A', label: 'A', order: 1, activities: [], is_terminal: false },
    ];

    vi.mocked(lifecycleApi.getWorkflowStages).mockResolvedValue(unsorted);

    const { result } = renderHook(() => useWorkflowStages(), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(result.current.data?.map((stage) => stage.key)).toEqual(['A', 'B']);
  });

  it('useCaseLifecycle consulta snapshot del backend', async () => {
    const snapshot: CaseLifecycleSnapshot = {
      current_stage: 'UBICADO',
      current_stage_label: 'Ubicado',
      source: 'AUTO',
      manual_override: { active: false },
      stages: [],
    };

    vi.mocked(lifecycleApi.getCaseLifecycle).mockResolvedValue(snapshot);

    const { result } = renderHook(() => useCaseLifecycle('case-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(lifecycleApi.getCaseLifecycle).toHaveBeenCalledWith('case-1');
    expect(result.current.data?.current_stage).toBe('UBICADO');
  });

  it('useLifecycleHistory consulta historial del caso', async () => {
    const history: LifecycleHistoryItem[] = [
      {
        from_stage: 'PENDIENTE',
        to_stage: 'UBICADO',
        source: 'AUTO',
        changed_at: '2026-03-15T10:00:00.000Z',
      },
    ];

    vi.mocked(lifecycleApi.getLifecycleHistory).mockResolvedValue(history);

    const { result } = renderHook(() => useLifecycleHistory('case-1'), { wrapper: createWrapper() });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    expect(lifecycleApi.getLifecycleHistory).toHaveBeenCalledWith('case-1');
    expect(result.current.data?.[0]?.to_stage).toBe('UBICADO');
  });

  it('useManualLifecycleOverride envia payload al backend', async () => {
    const snapshot: CaseLifecycleSnapshot = {
      current_stage: 'UBICADO',
      current_stage_label: 'Ubicado',
      source: 'MANUAL',
      manual_override: { active: true, target_stage: 'UBICADO' },
      stages: [],
    };

    vi.mocked(lifecycleApi.applyManualLifecycleOverride).mockResolvedValue(snapshot);

    const { result } = renderHook(() => useManualLifecycleOverride('case-1'), { wrapper: createWrapper() });

    await result.current.mutateAsync({
      target_stage: 'UBICADO',
      reason: 'Ajuste de soporte',
    });

    expect(lifecycleApi.applyManualLifecycleOverride).toHaveBeenCalledWith('case-1', {
      target_stage: 'UBICADO',
      reason: 'Ajuste de soporte',
    });
  });
});
