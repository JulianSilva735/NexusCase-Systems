import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { lifecycleApi } from '../api/lifecycleApi';
import type { ManualLifecycleOverridePayload } from '../types/lifecycle';

export const lifecycleKeys = {
  all: ['lifecycle'] as const,
  workflowStages: () => [...lifecycleKeys.all, 'workflow-stages'] as const,
  caseLifecycle: (caseId: string) => [...lifecycleKeys.all, 'case', caseId] as const,
  caseHistory: (caseId: string) => [...lifecycleKeys.all, 'history', caseId] as const,
};

export const useWorkflowStages = () =>
  useQuery({
    queryKey: lifecycleKeys.workflowStages(),
    queryFn: lifecycleApi.getWorkflowStages,
    staleTime: 1000 * 60 * 30,
    gcTime: 1000 * 60 * 60 * 12,
    select: (stages) => [...stages].sort((a, b) => a.order - b.order),
  });

export const useCaseLifecycle = (caseId?: string) =>
  useQuery({
    queryKey: caseId ? lifecycleKeys.caseLifecycle(caseId) : [...lifecycleKeys.all, 'case', 'empty'],
    queryFn: () => lifecycleApi.getCaseLifecycle(caseId as string),
    enabled: Boolean(caseId),
  });

export const useRecalculateLifecycle = (caseId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => lifecycleApi.recalculateCaseLifecycle(caseId as string),
    onSuccess: async () => {
      if (!caseId) return;
      await queryClient.invalidateQueries({ queryKey: lifecycleKeys.caseLifecycle(caseId) });
      await queryClient.invalidateQueries({ queryKey: lifecycleKeys.caseHistory(caseId) });
    },
  });
};

export const useManualLifecycleOverride = (caseId?: string) => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: ManualLifecycleOverridePayload) =>
      lifecycleApi.applyManualLifecycleOverride(caseId as string, payload),
    onSuccess: async () => {
      if (!caseId) return;
      await queryClient.invalidateQueries({ queryKey: lifecycleKeys.caseLifecycle(caseId) });
      await queryClient.invalidateQueries({ queryKey: lifecycleKeys.caseHistory(caseId) });
    },
  });
};

export const useLifecycleHistory = (caseId?: string) =>
  useQuery({
    queryKey: caseId ? lifecycleKeys.caseHistory(caseId) : [...lifecycleKeys.all, 'history', 'empty'],
    queryFn: () => lifecycleApi.getLifecycleHistory(caseId as string),
    enabled: Boolean(caseId),
  });
