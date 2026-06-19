import { api } from './axios';
import type {
  CaseLifecycleSnapshot,
  LifecycleHistoryItem,
  ManualLifecycleOverridePayload,
  WorkflowStage,
} from '../types/lifecycle';

export const lifecycleApi = {
  getWorkflowStages: async (): Promise<WorkflowStage[]> => {
    const response = await api.get<WorkflowStage[]>('/workflow/stages');
    return response.data;
  },

  getCaseLifecycle: async (caseId: string): Promise<CaseLifecycleSnapshot> => {
    const response = await api.get<CaseLifecycleSnapshot>(`/cases/${caseId}/lifecycle`);
    return response.data;
  },

  recalculateCaseLifecycle: async (caseId: string): Promise<CaseLifecycleSnapshot> => {
    const response = await api.post<CaseLifecycleSnapshot>(`/cases/${caseId}/lifecycle/recalculate`);
    return response.data;
  },

  applyManualLifecycleOverride: async (
    caseId: string,
    payload: ManualLifecycleOverridePayload,
  ): Promise<CaseLifecycleSnapshot> => {
    const response = await api.patch<CaseLifecycleSnapshot>(`/cases/${caseId}/lifecycle/manual`, payload);
    return response.data;
  },

  getLifecycleHistory: async (caseId: string): Promise<LifecycleHistoryItem[]> => {
    const response = await api.get<LifecycleHistoryItem[]>(`/cases/${caseId}/lifecycle/history`);
    return response.data;
  },
};
