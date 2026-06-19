import { api } from '../api/axios';

export interface DashboardStats {
  activeCases: number;
  pendingDocuments: number;
  upcomingExpirations: number;
  closedMonth: number;
}

export const CaseService = {
  getAll: async () => {
    const response = await api.get('/cases');
    return Array.isArray(response.data) ? response.data : (response.data as { data: unknown[] }).data ?? [];
  },
  getStats: async (): Promise<DashboardStats> => {
    const response = await api.get('/cases/dashboard-stats');
    return response.data;
  },
  getById: async (id: string) => {
    const response = await api.get(`/cases/${id}`);
    return response.data;
  },
  cancelCase: async (id: string, reason: string) => {
    try {
      await api.patch(`/cases/${id}/cancel`, { reason });
    } catch {
      await api.patch(`/cases/${id}`, { status: 'CANCELADO', reason });
    }
    const refreshed = await api.get(`/cases/${id}`);
    if (refreshed.data?.status !== 'CANCELADO') throw new Error('El backend no confirmó el estado CANCELADO.');
    return refreshed.data;
  },
};


