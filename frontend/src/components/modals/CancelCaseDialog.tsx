import React, { useState } from 'react';
import { 
  Dialog, DialogTitle, DialogContent, DialogActions, 
  Button, TextField, Typography, Alert 
} from '@mui/material';
import { Warning } from '@mui/icons-material';

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (reason: string) => void;
}

export const CancelCaseDialog: React.FC<Props> = ({ open, onClose, onConfirm }) => {
  const [reason, setReason] = useState('');
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (!reason.trim()) {
      setError(true);
      return;
    }
    onConfirm(reason);
    setReason('');
    setError(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1, color: '#d32f2f' }}>
        <Warning /> Cancelar Caso
      </DialogTitle>
      
      <DialogContent dividers>
        <Typography variant="body2" sx={{ mb: 2 }}>
          Estás a punto de cancelar este caso. Esta acción bloqueará la edición y detendrá el flujo.
          Por favor, ingresa el motivo de la cancelación (Obligatorio).
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>El motivo es obligatorio.</Alert>}

        <TextField
          fullWidth
          multiline
          rows={3}
          label="Motivo de Cancelación"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          variant="outlined"
          color="error"
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} color="inherit">Volver</Button>
        <Button 
            onClick={handleSubmit} 
            variant="contained" 
            color="error"
        >
            Confirmar Cancelación
        </Button>
      </DialogActions>
    </Dialog>
  );
};