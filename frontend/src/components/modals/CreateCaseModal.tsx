import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { api } from '../../api/axios'; 
// Usamos 'import type' para cumplir con verbatimModuleSyntax
import type { CreateCasePayload } from '../../types/case';

interface CreateCaseModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void; 
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({ open, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState<CreateCasePayload>({
    clientName: '',
    clientIdNumber: '',
    clientPhone: '',
    clientEmail: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async () => {
    if (!formData.clientName.trim() || !formData.clientIdNumber.trim()) {
      setError('El nombre y la identificación son obligatorios.');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      await api.post('/cases', formData);
      
      setFormData({ 
        clientName: '', 
        clientIdNumber: '', 
        clientPhone: '', 
        clientEmail: ''
      });      
      onSuccess(); 
      onClose();
    } catch (err: any) {
      console.error('Error creando caso:', err);
      // Mostramos el error que venga del backend (ej: Cédula duplicada) o uno genérico
      setError(err.response?.data?.message || 'Error al crear el caso. Verifica los datos.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={!loading ? onClose : undefined} maxWidth="sm" fullWidth>
      <DialogTitle>Registrar Nuevo Caso</DialogTitle>
      
      <DialogContent dividers>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}

        {/* Grid container usando sintaxis v6 */}
        <Grid container spacing={2} sx={{ mt: 0 }}>
          {/* Nombre Completo */}
          <Grid xs={12}>
            <TextField
              fullWidth
              label="Nombre Completo del Cliente"
              name="clientName"
              value={formData.clientName}
              onChange={handleChange}
              disabled={loading}
              required
            />
          </Grid>

          {/* Cédula */}
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Número de Identificación"
              name="clientIdNumber"
              value={formData.clientIdNumber}
              onChange={handleChange}
              disabled={loading}
              required
              type="number" 
            />
          </Grid>

          {/* Teléfono */}
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Teléfono / Celular"
              name="clientPhone"
              value={formData.clientPhone}
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>

          {/* Email - NUEVO */}
          <Grid xs={12} sm={6}>
            <TextField
              fullWidth
              label="Correo Electrónico"
              name="clientEmail"
              type="email"
              value={(formData as any).clientEmail} // Cast si TS se queja
              onChange={handleChange}
              disabled={loading}
            />
          </Grid>
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} disabled={loading} color="inherit">
          Cancelar
        </Button>
        <Button 
          onClick={handleSubmit} 
          variant="contained" 
          color="success" 
          disabled={loading}
          startIcon={loading ? <CircularProgress size={20} /> : null}
        >
          {loading ? 'Creando...' : 'Crear Caso'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
