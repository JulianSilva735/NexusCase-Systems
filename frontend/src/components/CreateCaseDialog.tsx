import { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Alert
} from '@mui/material';
import { api } from '../api/axios';

/**
 * PROPS: Parámetros que recibe este modal desde el padre.
 * - open: Booleano para saber si se muestra u oculta.
 * - onClose: Función que el padre nos pasa para poder cerrarnos.
 * - onSuccess: Callback para avisar al padre que "ya creé el caso, actualiza la lista".
 */
interface CreateCaseDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCaseDialog = ({ open, onClose, onSuccess }: CreateCaseDialogProps) => {
  // Estado local para los campos del formulario
  const [formData, setFormData] = useState({
    clientName: '',
    clientIdNumber: '',
    clientPhone: ''
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  /**
   * Manejador genérico de inputs ("Event Handler").
   * En lugar de hacer una función para cambiar nombre, otra para teléfono, etc.,
   * usamos `e.target.name` mapeado al estado.
   */
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async () => {
    // Validacion simple antes de enviar
    if (!formData.clientName || !formData.clientIdNumber) {
      setError("Nombre y Cédula son obligatorios");
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Enviamos al Backend (Ajusta los nombres según tu DTO CreateCaseDto)
      await api.post('/cases', {
        clientName: formData.clientName,
        clientIdNumber: formData.clientIdNumber,
        clientPhone: formData.clientPhone
      });

      // ¡Éxito!
      setFormData({ clientName: '', clientIdNumber: '', clientPhone: '' }); // Limpiar form
      onSuccess(); // Avisar al padre que recargue
      onClose();   // Cerrar modal

    } catch (err: any) {
      console.error(err);
      // Intentamos mostrar el mensaje que manda NestJS
      setError(err.response?.data?.message || 'Error al crear el caso');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle fontWeight="bold">Registrar Nuevo Caso</DialogTitle>

      <DialogContent>
        <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 2 }}>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Cédula / Identificación"
            name="clientIdNumber"
            fullWidth
            required
            value={formData.clientIdNumber}
            onChange={handleChange}
            placeholder="Ej: 1020304050"
          />

          <TextField
            label="Nombre del Cliente"
            name="clientName"
            fullWidth
            required
            value={formData.clientName}
            onChange={handleChange}
            placeholder="Ej: Pepito Pérez"
          />

          <TextField
            label="Teléfono de Contacto"
            name="clientPhone"
            fullWidth
            value={formData.clientPhone}
            onChange={handleChange}
            placeholder="Ej: 300 123 4567"
          />
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3 }}>
        <Button onClick={onClose} color="inherit" disabled={loading}>
          Cancelar
        </Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          color="success"
          disabled={loading}
        >
          {loading ? 'Creando...' : 'Crear Caso'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};
