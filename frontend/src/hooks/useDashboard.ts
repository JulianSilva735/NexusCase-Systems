import { useState, useEffect, useCallback } from 'react';
import { type Case, type Document } from '../types/case';
import { CaseService, type DashboardStats } from '../services/case.service';

export const useDashboard = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [stats, setStats] = useState<DashboardStats>({ activeCases: 0, pendingDocuments: 0, upcomingExpirations: 0, closedMonth: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [casesData, statsData] = await Promise.all([CaseService.getAll(), CaseService.getStats()]);

      const casesWithDocuments = await Promise.all(
        casesData.map(async (caseItem: Case) => {
          try { return await CaseService.getById(caseItem.id); }
          catch { return caseItem; }
        })
      );

      const totalPendingDocuments = casesWithDocuments.reduce((total: number, caseItem: Case) => {
        if (caseItem.status === 'FINALIZADO' || caseItem.status === 'CANCELADO') return total;
        return total + (caseItem.documents?.filter((doc: Document) => doc.status === 'PENDING').length ?? 0);
      }, 0);

      setCases(casesWithDocuments);
      setStats({ ...statsData, pendingDocuments: totalPendingDocuments });
      setError('');
    } catch (err) {
      if (import.meta.env.DEV) console.error('[useDashboard]', err);
      setError('Error conectando al servidor.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  return { cases, stats, loading, error, refreshDashboard: fetchData };
};
