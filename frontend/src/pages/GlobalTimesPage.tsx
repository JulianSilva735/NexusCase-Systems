import { useEffect, useState } from 'react';
import { 
  Box, Typography, Paper, Table, TableBody, TableCell, 
  TableContainer, TableHead, TableRow, Chip, LinearProgress, 
  Avatar, Tooltip, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, Button, Grid,
  TextField, FormControl, InputLabel, Select, MenuItem, Alert
} from '@mui/material';
import { 
  AccessTime, Warning, CheckCircle, Edit, Speed, Save 
} from '@mui/icons-material';
import { format, differenceInDays, addDays, addWeeks, addMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from '../api/axios'; 

export const GlobalTimesPage = () => {
  const [cases, setCases] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // --- ESTADOS PARA EL MODAL ---
  const [openModal, setOpenModal] = useState(false);
  const [editingCase, setEditingCase] = useState<any>(null);
  
  const [duration, setDuration] = useState<number | string>('');
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months'>('months');
  const [priority, setPriority] = useState('MEDIA');
  const [saving, setSaving] = useState(false);

  // 1. CARGAR DATOS
  const fetchAllCases = async () => {
    try {
      const { data } = await api.get('/cases'); 
      setCases(data);
    } catch (error) {
      console.error("Error cargando casos", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllCases();
  }, []);

  // 2. ABRIR MODAL
  const handleEditClick = (caseItem: any) => {
    setEditingCase(caseItem);
    setPriority(caseItem.priority || 'MEDIA');
    setDuration(''); 
    setOpenModal(true);
  };

  // 3. GUARDAR CAMBIOS
  const handleSaveConfig = async () => {
    if (!editingCase) return;

    try {
      setSaving(true);
      
      let newDeadline = new Date();
      if (duration && !isNaN(Number(duration))) {
         const num = Number(duration);
         if (unit === 'days') newDeadline = addDays(new Date(), num);
         if (unit === 'weeks') newDeadline = addWeeks(new Date(), num);
         if (unit === 'months') newDeadline = addMonths(new Date(), num);
      } else {
         if(editingCase.deadline) newDeadline = new Date(editingCase.deadline);
      }

      // Construir el payload
      const payload: any = {
        priority: priority
      };
      
      // Agregar deadline en formato ISO 8601 válido
      if (duration && !isNaN(Number(duration))) {
        payload.deadline = newDeadline.toISOString();
      } else if (editingCase.deadline) {
        payload.deadline = newDeadline.toISOString();
      }

      await api.patch(`/cases/${editingCase.id}`, payload);

      setCases(prevCases => prevCases.map(c => {
          if (c.id === editingCase.id) {
              return { ...c, priority, deadline: newDeadline.toISOString() };
          }
          return c;
      }));

      setOpenModal(false);

    } catch (error) {
      console.error("Error guardando", error);
      alert("Error al guardar la configuración");
    } finally {
      setSaving(false);
    }
  };

  // HELPERS
  const getStatusColor = (deadline: string | null) => {
    if (!deadline) return 'default';
    const daysLeft = differenceInDays(new Date(deadline), new Date());
    if (daysLeft < 0) return 'error'; 
    if (daysLeft <= 5) return 'warning'; 
    return 'success'; 
  };

  const getStatusText = (deadline: string | null) => {
    if (!deadline) return 'Sin asignar';
    const daysLeft = differenceInDays(new Date(deadline), new Date());
    if (daysLeft < 0) return `Vencido hace ${Math.abs(daysLeft)} días`;
    if (daysLeft === 0) return 'Vence HOY';
    return `Quedan ${daysLeft} días`;
  };

  return (
    <Box>
      {/* CABECERA */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <AccessTime sx={{ fontSize: 40, color: 'primary.main' }} />
        <Box>
            <Typography variant="h4" fontWeight="bold" color="#1e293b">
            Gestión Masiva de Tiempos
            </Typography>
            <Typography variant="body1" color="text.secondary">
            Configura tiempos y prioridades rápidamente sin entrar a cada caso.
            </Typography>
        </Box>
      </Box>

      {/* TABLA GLOBAL */}
      <TableContainer component={Paper} elevation={2}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead sx={{ bgcolor: '#f1f5f9' }}>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Caso</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Responsable</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Prioridad</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Vencimiento</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Estado</TableCell>
              <TableCell align="center" sx={{ fontWeight: 'bold' }}>Configurar</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
               <TableRow><TableCell colSpan={6}><LinearProgress /></TableCell></TableRow>
            ) : cases.map((row) => {
                const statusColor = getStatusColor(row.deadline);
                const statusText = getStatusText(row.deadline);

                return (
                  <TableRow key={row.id} hover>
                    <TableCell>
                        <Typography variant="subtitle2" fontWeight="bold">{row.caseCode || 'NEW'}</Typography>
                        <Typography variant="caption" display="block">{row.clientName}</Typography>
                    </TableCell>
                    
                    <TableCell>
                         <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar sx={{ width: 24, height: 24, fontSize: 10, bgcolor: '#64748b' }}>
                                {row.assignedTo?.fullName?.charAt(0) || '?'}
                            </Avatar>
                            <Typography variant="body2" sx={{ fontSize: '0.85rem' }}>
                                {row.assignedTo?.fullName || '---'}
                            </Typography>
                        </Box>
                    </TableCell>

                    <TableCell>
                        <Chip 
                            label={row.priority || 'MEDIA'} 
                            size="small"
                            color={row.priority === 'ALTA' ? 'error' : row.priority === 'BAJA' ? 'success' : 'default'}
                            variant="outlined"
                        />
                    </TableCell>

                    <TableCell>
                        {row.deadline ? (
                            format(new Date(row.deadline), "dd MMM yyyy", { locale: es })
                        ) : (
                            <Typography variant="caption" color="text.disabled">--/--/----</Typography>
                        )}
                    </TableCell>

                    <TableCell>
                        <Chip 
                            size="small"
                            icon={statusColor === 'error' ? <Warning /> : (statusColor === 'success' ? <CheckCircle /> : undefined)}
                            label={statusText}
                            color={statusColor as any}
                            sx={{ fontWeight: 'bold', minWidth: 100 }}
                        />
                    </TableCell>

                    <TableCell align="center">
                        <Tooltip title="Configurar tiempo">
                            <IconButton 
                                color="primary" 
                                onClick={() => handleEditClick(row)}
                                sx={{ bgcolor: '#eff6ff', '&:hover': { bgcolor: '#dbeafe' } }}
                            >
                                <Edit fontSize="small" />
                            </IconButton>
                        </Tooltip>
                    </TableCell>
                  </TableRow>
                );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* --- MODAL DE EDICIÓN RÁPIDA --- */}
      <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ bgcolor: '#1e293b', color: 'white', display: 'flex', alignItems: 'center', gap: 1 }}>
            <AccessTime />
            Configurar Tiempos
        </DialogTitle>
        
        <DialogContent dividers>
            {editingCase && (
                <Box>
                    <Alert severity="info" sx={{ mb: 3 }}>
                        Configurando caso de: <strong>{editingCase.clientName}</strong>
                    </Alert>

                    {/* ✅ CORRECCIÓN 2: Uso correcto de Grid v6 */}
                    <Grid container spacing={3}>
                        
                        {/* Prioridad */}
                        <Grid xs={12}>
                            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Nivel de Prioridad:</Typography>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                                {['BAJA', 'MEDIA', 'ALTA'].map((level) => (
                                <Chip 
                                    key={level}
                                    label={level}
                                    color={priority === level ? (level === 'ALTA' ? 'error' : level === 'MEDIA' ? 'warning' : 'success') : 'default'}
                                    variant={priority === level ? 'filled' : 'outlined'}
                                    onClick={() => setPriority(level)}
                                    icon={<Speed />}
                                    clickable
                                    sx={{ px: 2, py: 1 }}
                                />
                                ))}
                            </Box>
                        </Grid>

                        {/* Calculadora */}
                        <Grid xs={12}>
                             <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>Definir Tiempo Límite:</Typography>
                             <Box sx={{ display: 'flex', gap: 2 }}>
                                <TextField
                                    label="Cantidad"
                                    type="number"
                                    value={duration}
                                    onChange={(e) => setDuration(e.target.value)}
                                    fullWidth
                                    autoFocus
                                    placeholder="Ej: 3"
                                />
                                <FormControl fullWidth>
                                    <InputLabel>Unidad</InputLabel>
                                    <Select
                                        value={unit}
                                        label="Unidad"
                                        onChange={(e) => setUnit(e.target.value as any)}
                                    >
                                        <MenuItem value="days">Días</MenuItem>
                                        <MenuItem value="weeks">Semanas</MenuItem>
                                        <MenuItem value="months">Meses</MenuItem>
                                    </Select>
                                </FormControl>
                             </Box>
                             <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                                * Esto calculará la fecha límite a partir de hoy.
                             </Typography>
                        </Grid>
                    </Grid>
                </Box>
            )}
        </DialogContent>
        
        <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
            <Button 
                onClick={handleSaveConfig} 
                variant="contained" 
                color="primary"
                startIcon={<Save />}
                disabled={!duration || saving}
            >
                {saving ? 'Guardando...' : 'Aplicar Cambios'}
            </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};
