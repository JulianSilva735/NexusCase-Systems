import { useMemo, useState } from 'react';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { isAxiosError } from 'axios';
import { useManualLifecycleOverride } from '../hooks/useLifecycle';
import type { ManualLifecycleOverridePayload, WorkflowStage } from '../types/lifecycle';

interface Props {
  open: boolean;
  onClose: () => void;
  caseId?: string;
  workflowStages: WorkflowStage[];
}

export const ManualOverrideModal = ({ open, onClose, caseId, workflowStages }: Props) => {
  const manualOverrideMutation = useManualLifecycleOverride(caseId);

  const [targetStage, setTargetStage] = useState('');
  const [reason, setReason] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [invalidTransitionPayload, setInvalidTransitionPayload] =
    useState<ManualLifecycleOverridePayload | null>(null);

  const sortedStages = useMemo(
    () => [...workflowStages].sort((a, b) => a.order - b.order),
    [workflowStages],
  );

  const resetForm = () => {
    setTargetStage('');
    setReason('');
    setErrorMessage('');
    setInvalidTransitionPayload(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const applyOverride = async (payload: ManualLifecycleOverridePayload) => {
    setErrorMessage('');

    try {
      await manualOverrideMutation.mutateAsync(payload);
      handleClose();
    } catch (error) {
      const status = isAxiosError(error)
        ? error.response?.status
        : (error as { response?: { status?: number } })?.response?.status;

      if (status === 403) {
        setErrorMessage('No tienes permisos para aplicar override manual. Esta accion requiere rol ADMINISTRADOR o SUPERVISOR.');
        return;
      }

      if (status === 400) {
        setInvalidTransitionPayload(payload);
        return;
      }

      setErrorMessage('No se pudo aplicar override manual. Intenta nuevamente.');
    }
  };

  const handleSubmit = async () => {
    if (!targetStage) {
      setErrorMessage('Debes seleccionar una etapa objetivo o AUTO para desactivar override.');
      return;
    }

    const payload: ManualLifecycleOverridePayload = {
      target_stage: targetStage,
      reason: reason.trim() || undefined,
    };

    await applyOverride(payload);
  };

  const handleForceConfirm = async () => {
    if (!invalidTransitionPayload) return;

    const payload: ManualLifecycleOverridePayload = {
      ...invalidTransitionPayload,
      force_invalid_transition: true,
    };

    setInvalidTransitionPayload(null);
    await applyOverride(payload);
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
        <DialogTitle>Override Manual de Lifecycle</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Selecciona una etapa para aplicar override manual. Si eliges AUTO, se desactiva el override.
            </Typography>

            <TextField
              select
              SelectProps={{ native: true }}
              label="Etapa objetivo"
              value={targetStage}
              onChange={(event) => setTargetStage(event.target.value)}
              fullWidth
            >
              <option value="" disabled>Selecciona una opcion</option>
              <option value="AUTO">AUTO (desactivar override manual)</option>
              {sortedStages.map((stage) => (
                <option key={stage.key} value={stage.key}>
                  {stage.label}
                </option>
              ))}
            </TextField>

            <TextField
              label="Motivo"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              multiline
              minRows={2}
              fullWidth
            />

            {errorMessage && <Alert severity="error">{errorMessage}</Alert>}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose} color="inherit">Cancelar</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={manualOverrideMutation.isPending}>
            Aplicar
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={Boolean(invalidTransitionPayload)} onClose={() => setInvalidTransitionPayload(null)}>
        <DialogTitle>Transicion invalida</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            El backend reporto salto invalido entre etapas. Puedes confirmar para reintentar con forzado.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setInvalidTransitionPayload(null)} color="inherit">Cancelar</Button>
          <Button onClick={handleForceConfirm} variant="contained" color="warning">
            Forzar transicion
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};
