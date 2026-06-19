import { Alert, Box, LinearProgress, Paper, Stack, Typography } from '@mui/material';
import { CheckCircle, RadioButtonChecked, RadioButtonUnchecked } from '@mui/icons-material';
import type { CaseLifecycleSnapshot, LifecycleStageSnapshot, WorkflowStage } from '../../types/lifecycle';

interface Props {
  workflowStages: WorkflowStage[];
  lifecycle?: CaseLifecycleSnapshot;
  loading?: boolean;
  error?: string;
}

const getStageVisual = (status?: LifecycleStageSnapshot['status']) => {
  if (status === 'completed') {
    return { color: 'success' as const, icon: <CheckCircle fontSize="small" />, bg: '#e8f5e9' };
  }

  if (status === 'current') {
    return { color: 'primary' as const, icon: <RadioButtonChecked fontSize="small" />, bg: '#e3f2fd' };
  }

  return { color: 'inherit' as const, icon: <RadioButtonUnchecked fontSize="small" />, bg: '#f8fafc' };
};

const safeProgress = (value?: number): number => {
  if (typeof value !== 'number' || Number.isNaN(value)) return 0;
  return Math.min(Math.max(value, 0), 100);
};

export const CaseLifecycleTimeline = ({ workflowStages, lifecycle, loading, error }: Props) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2, borderRadius: 2 }}>
        <Typography variant="body2" color="text.secondary">
          Cargando lifecycle del caso...
        </Typography>
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!lifecycle) {
    return <Alert severity="info">No hay snapshot de lifecycle disponible para este caso.</Alert>;
  }

  const lifecycleByKey = new Map(lifecycle.stages.map((stage) => [stage.key, stage]));
  const orderedStages = [...workflowStages].sort((a, b) => a.order - b.order);

  return (
    <Paper sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="subtitle1" fontWeight="bold">
          Lifecycle del Caso
        </Typography>
      </Stack>

      {orderedStages.length === 0 ? (
        <Alert severity="info">El backend no ha configurado etapas en workflow.</Alert>
      ) : (
        <Box
          sx={{
            display: 'flex',
            gap: 0.75,
            overflowX: 'auto',
            pb: 0.5,
            pr: 0.5,
            '&::-webkit-scrollbar': { height: 6 },
            '&::-webkit-scrollbar-track': { bgcolor: '#f1f5f9', borderRadius: 10 },
            '&::-webkit-scrollbar-thumb': { bgcolor: '#cbd5e1', borderRadius: 10 },
          }}
        >
          {orderedStages.map((workflowStage, index) => {
            const stageSnapshot = lifecycleByKey.get(workflowStage.key);
            const visual = getStageVisual(stageSnapshot?.status);
            const progress = safeProgress(stageSnapshot?.progress);

            return (
              <Stack key={workflowStage.key} direction="row" alignItems="center" spacing={1}>
                <Paper
                  variant="outlined"
                  sx={{
                    p: 0.75,
                    minWidth: 150,
                    bgcolor: visual.bg,
                    borderColor: stageSnapshot?.status === 'current' ? '#1976d2' : '#cbd5e1',
                  }}
                >
                  <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mb: 0.25 }}>
                    {visual.icon}
                    <Typography variant="caption" fontWeight={700} sx={{ whiteSpace: 'nowrap' }}>
                      {workflowStage.label}
                    </Typography>
                  </Stack>

                  <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.25 }}>
                    {stageSnapshot?.status ?? 'pending'}
                  </Typography>

                  <LinearProgress
                    variant="determinate"
                    value={progress}
                    color={visual.color}
                    sx={{ height: 6, borderRadius: 6 }}
                  />

                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: 11 }}>
                    {progress}%
                    {stageSnapshot
                      ? ` - ${stageSnapshot.completed_activities}/${stageSnapshot.total_activities} actividades`
                      : ''}
                  </Typography>
                </Paper>

                {index < orderedStages.length - 1 && (
                  <Typography color="text.disabled" fontWeight="bold">
                    &gt;
                  </Typography>
                )}
              </Stack>
            );
          })}
        </Box>
      )}
    </Paper>
  );
};
