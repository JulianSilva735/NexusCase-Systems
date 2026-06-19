import { useEffect, useState } from 'react';
import { 
  Box, 
  Typography, 
  Paper, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  IconButton, 
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  CircularProgress,
  Alert
} from '@mui/material';
import { Edit as EditIcon, Timer, InfoOutlined } from '@mui/icons-material';
import { MainLayout } from '../../layouts/MainLayout';
import { api } from '../../api/axios';

interface CaseState {
  id: string;
  label: string;
  description: string;
  maxDays: number;
  order: number;
}

export const StatesAdminPage = () => {
  const [states, setStates] = useState<CaseState[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para el Modal de Edición
  const [open, setOpen] = useState(false);
  const [editingState, setEditingState] = useState<CaseState | null>(null);

  // 1. Cargar Estados del Backend
  const fetchStates = async () => {
    try {
      const { data } = await api.get('/cases/states');
      // Ordenamos por el campo 'order' para que se vea igual al flujo
      const sorted = data.sort((a: CaseState, b: CaseState) => a.order - b.order);
      setStates(sorted);
    } catch (error) {
      console.error("Error cargando estados", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStates();
  }, []);

  // 2. Abrir Modal al dar click en Editar
  const handleEdit = (state: CaseState) => {
    setEditingState({ ...state }); // Copia para no mutar directo
    setOpen(true);
  };

  // 3. Guardar Cambios en el Backend
  const handleSave = async () => {
    if (!editingState) return;
    try {
      // Enviamos solo lo que se puede editar
      await api.patch(`/cases/states/${editingState.id}`, {
        label: editingState.label,
        description: editingState.description,
        maxDays: parseInt(editingState.maxDays.toString())
      });
      setOpen(false);
      fetchStates(); // Recargar la tabla para ver cambios
    } catch (error) {
      console.error("Error guardando", error);
      alert("Hubo un error al guardar los cambios.");
    }
  };

  if (loading) return (
    <MainLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 10 }}><CircularProgress /></Box>
    </MainLayout>
  );

  return (
    <MainLayout>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="bold" color="primary" gutterBottom>
          Administración de Estados
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Configura los tiempos de atención (SLA) y los nombres visibles de cada etapa del flujo.
        </Typography>
        <Alert severity="info" sx={{ mt: 2, maxWidth: 600 }}>
            Los cambios en <strong>"Tiempo Máx."</strong> afectarán inmediatamente a las alertas de vencimiento en el tablero de gestión.
        </Alert>
      </Box>

      <TableContainer component={Paper} elevation={2} sx={{ borderRadius: 2 }}>
        <Table>
          <TableHead sx={{ bgcolor: '#f5f5f5' }}>
            <TableRow>
              <TableCell align="center" width={80}><strong>Orden</strong></TableCell>
              <TableCell width={150}><strong>ID Interno</strong></TableCell>
              <TableCell width={200}><strong>Etiqueta Visible</strong></TableCell>
              <TableCell><strong>Descripción</strong></TableCell>
              <TableCell align="center" width={150}><strong>Tiempo Máx. (SLA)</strong></TableCell>
              <TableCell align="center" width={100}><strong>Editar</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {states.map((state) => (
              <TableRow key={state.id} hover>
                <TableCell align="center">
                    <Chip label={state.order} size="small" sx={{ fontWeight: 'bold' }} />
                </TableCell>
                <TableCell sx={{ color: 'text.secondary', fontFamily: 'monospace', fontSize: '0.85rem' }}>
                    {state.id}
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold', color: '#1e293b' }}>
                    {state.label}
                </TableCell>
                <TableCell sx={{ color: 'text.secondary' }}>{state.description}</TableCell>
                <TableCell align="center">
                    <Chip 
                        icon={<Timer fontSize="small"/>} 
                        label={`${state.maxDays} días`} 
                        color={state.maxDays > 0 ? "warning" : "default"} 
                        variant={state.maxDays > 0 ? "filled" : "outlined"}
                        size="small"
                    />
                </TableCell>
                <TableCell align="center">
                  <IconButton onClick={() => handleEdit(state)} color="primary">
                    <EditIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- MODAL DE EDICIÓN --- */}
      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <EditIcon color="primary"/> 
            Editar Estado: {editingState?.id}
        </DialogTitle>
        <DialogContent dividers>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3, pt: 1 }}>
                
                <Box>
                    <Typography variant="caption" color="text.secondary" display="block" mb={1}>
                        <InfoOutlined fontSize="inherit" sx={{ mr: 0.5, verticalAlign: 'middle' }}/>
                        El ID Interno no se puede cambiar para proteger la integridad del sistema.
                    </Typography>
                    <TextField
                        label="Nombre Visible (Etiqueta)"
                        fullWidth
                        value={editingState?.label || ''}
                        onChange={(e) => setEditingState(prev => prev ? {...prev, label: e.target.value} : null)}
                        helperText="Nombre que verán los operadores en el tablero."
                    />
                </Box>
                
                <TextField
                    label="Descripción"
                    fullWidth
                    multiline
                    rows={2}
                    value={editingState?.description || ''}
                    onChange={(e) => setEditingState(prev => prev ? {...prev, description: e.target.value} : null)}
                />

                <TextField
                    label="Tiempo Máximo (Días Hábiles)"
                    type="number"
                    fullWidth
                    value={editingState?.maxDays || 0}
                    onChange={(e) => setEditingState(prev => prev ? {...prev, maxDays: Number(e.target.value)} : null)}
                    InputProps={{ inputProps: { min: 0 } }}
                    helperText="Si un caso supera estos días en esta etapa, se marcará como VENCIDO."
                />
            </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={() => setOpen(false)} color="inherit">Cancelar</Button>
            <Button onClick={handleSave} variant="contained" color="primary">Guardar Cambios</Button>
        </DialogActions>
      </Dialog>

    </MainLayout>
  );
};
