import { useState, useEffect } from 'react';
import { 
  Box, Card, CardContent, Typography, Grid,
  TextField, MenuItem, Button, Divider, Alert, Chip, 
  FormControl, InputLabel, Select
} from '@mui/material';
import { AccessTime, Event, Save, Speed, AdminPanelSettings } from '@mui/icons-material';
import { LocalizationProvider } from '@mui/x-date-pickers';
import { DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, addMonths, addWeeks, format } from 'date-fns';
import { es } from 'date-fns/locale';
import { api } from "../api/axios";

interface Props {
  caseId: string;
  currentDeadline?: string;
  currentPriority?: string;
  userRole: string;
  onUpdate?: () => void;
}

export const TimesTab = ({ caseId, currentDeadline, currentPriority, userRole, onUpdate }: Props) => {
  const [duration, setDuration] = useState<number | string>('');
  const [unit, setUnit] = useState<'days' | 'weeks' | 'months'>('months');
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(currentDeadline ? new Date(currentDeadline) : null);
  const [priority, setPriority] = useState(currentPriority || 'MEDIA');
  
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (duration && !isNaN(Number(duration))) {
      const num = Number(duration);
      const today = new Date();
      let newDate = today;

      if (unit === 'days') newDate = addDays(today, num);
      if (unit === 'weeks') newDate = addWeeks(today, num);
      if (unit === 'months') newDate = addMonths(today, num);

      setSelectedDate(newDate);
    }
  }, [duration, unit]);

  const handleSave = async () => {
    try {
      setLoading(true);
      
      let deadlineISO: string | null = null;
      if (selectedDate) {
        deadlineISO = selectedDate.toISOString();
      }
      
      await api.patch(`/cases/${caseId}`, {
        priority: priority,
        deadline: deadlineISO
      });
      setSaved(true);
      if (onUpdate) onUpdate();
      setTimeout(() => setSaved(false), 3000);
    } catch (error) {
      console.error("Error guardando tiempos", error);
    } finally {
      setLoading(false);
    }
  };

  if (userRole === 'OPERADOR') {
    return (
      <Box sx={{ p: 4, textAlign: 'center' }}>
        <Alert severity="info">
          La configuración de tiempos y prioridades está reservada para Supervisores y Administradores.
          <br />
          <strong>Fecha límite actual:</strong> {selectedDate ? format(selectedDate, "dd 'de' MMMM, yyyy", { locale: es }) : 'No definida'}
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{ maxWidth: 900, mx: 'auto', p: 2 }}>
      <Card variant="outlined" sx={{ boxShadow: 3, borderRadius: 2 }}>
        <Box sx={{ bgcolor: '#1e293b', color: 'white', p: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <AccessTime />
          <Typography variant="h6">Configuración de SLA (Tiempos de Atención)</Typography>
        </Box>
        
        <CardContent sx={{ p: 4 }}>
          {/* Grid container */}
          <Grid container spacing={4}>
            
            {/* COLUMNA IZQUIERDA: Definición de parámetros */}
            <Grid xs={12} md={6}>
              <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                1. DEFINIR DURACIÓN DEL CASO
              </Typography>
              
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  label="Cantidad"
                  type="number"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  fullWidth
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

              <Divider sx={{ my: 3 }}>O selección manual</Divider>

              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
                <DatePicker
                  label="Seleccionar Fecha Límite Manualmente"
                  value={selectedDate}
                  // Corrección de TypeScript aquí:
                  onChange={(newValue: Date | null) => setSelectedDate(newValue)}
                  slotProps={{ textField: { fullWidth: true } }}
                />
              </LocalizationProvider>
            </Grid>

            {/* COLUMNA DERECHA: Resumen y Prioridad */}
            <Grid xs={12} md={6}>
               <Typography variant="subtitle2" color="primary" sx={{ mb: 2, fontWeight: 'bold' }}>
                2. PRIORIDAD Y VISUALIZACIÓN
              </Typography>

              <Box sx={{ mb: 4 }}>
                 <Typography variant="body2" color="text.secondary" gutterBottom>
                   Nivel de prioridad del caso:
                 </Typography>
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
                        sx={{ px: 2, py: 2 }}
                      />
                    ))}
                 </Box>
              </Box>

              <Card variant="outlined" sx={{ bgcolor: '#f8fafc', p: 2, textAlign: 'center', border: '1px dashed #94a3b8' }}>
                <Typography variant="caption" color="text.secondary" display="block">
                  RESULTADO FINAL
                </Typography>
                <Typography variant="h4" color="text.primary" fontWeight="bold" sx={{ mt: 1 }}>
                  {selectedDate ? format(selectedDate, "dd MMM yyyy", { locale: es }) : '--/--/----'}
                </Typography>
                <Typography variant="body2" color={selectedDate ? 'error.main' : 'text.disabled'} sx={{ mt: 1, fontWeight: 'bold' }}>
                  <Event sx={{ fontSize: 16, verticalAlign: 'text-bottom', mr: 0.5 }} />
                  Fecha Límite de Cierre
                </Typography>
              </Card>

            </Grid>
          </Grid>

          <Box sx={{ mt: 4, display: 'flex', justifyContent: 'flex-end' }}>
             <Button
               variant="contained"
               size="large"
               startIcon={<Save />}
               onClick={handleSave}
               disabled={loading || !selectedDate}
               sx={{ px: 5 }}
             >
               {loading ? 'Guardando...' : 'Aplicar Configuración de Tiempo'}
             </Button>
          </Box>
          
          {saved && (
            <Alert severity="success" sx={{ mt: 2 }}>
              ¡Tiempos actualizados! El sistema ahora rastreará el vencimiento de este caso.
            </Alert>
          )}

        </CardContent>
      </Card>
      
      <Box sx={{ mt: 2, textAlign: 'center' }}>
        <Chip icon={<AdminPanelSettings />} label="Vista exclusiva de Administrador / Supervisor" size="small" />
      </Box>
    </Box>
  );
};
