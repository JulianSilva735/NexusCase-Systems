import { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Button,
  TextField,
  InputAdornment,
  Chip,
  CircularProgress,
  Alert,
  Grid
} from '@mui/material';
import { Add, Search, PersonOutline, CalendarToday } from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';
import { CaseStatus } from '../types/case';
import { CreateCaseModal } from '../components/modals/CreateCaseModal';
import { useNavigate } from 'react-router-dom';
import { StatCard } from '../components/common/StatCard';
import { useDashboard } from '../hooks/useDashboard';

/**
 * PÁGINA: Dashboard (Panel Principal)
 * 
 * Muestra el resumen global y la lista de casos.
 * NOTA: Esta página delega toda la lógica de datos al Hook `useDashboard`.
 * Esto mantiene el código de la vista limpio y fácil de leer.
 */
export const Dashboard = () => {
  const navigate = useNavigate();

  // Custom Hook: Nos entrega los datos (cases, stats) y el estado de carga (loading)
  const { cases, stats, loading, error, refreshDashboard } = useDashboard();

  // Estado local solo para controlar si la ventana modal de "Nuevo Caso" está abierta o no
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Lógica de Roles (Seguridad en Frontend)
  const user = JSON.parse(localStorage.getItem('user') || '{}');
  const userRole = user?.role || '';
  const canManageTimes = ['ADMINISTRADOR', 'SUPERVISOR'].includes(userRole);

  /**
   * Función UI: Determina el color del Chip según el estado del caso.
   * Switch-case simple de presentación.
   */
  const getStatusColor = (status: string) => {
    switch (status as CaseStatus) {
      case CaseStatus.FINALIZADO: return 'success';
      case CaseStatus.ANALISIS: return 'info';
      case CaseStatus.RECOLECCION: return 'warning';
      case CaseStatus.CANCELADO: return 'error';
      default: return 'default';
    }
  };

  const handleTimeNavigation = () => {
    if (canManageTimes) {
      navigate('/admin/times');
    }
  };

  return (
    <MainLayout>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: '#1e293b' }}>
          Resumen Operativo
        </Typography>

        <Button
          variant="contained"
          color="success"
          startIcon={<Add />}
          sx={{ px: 3, py: 1, fontWeight: 'bold', borderRadius: 2 }}
          onClick={() => setIsModalOpen(true)}
        >
          Nuevo Caso
        </Button>
      </Box>

      <CreateCaseModal
        open={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={() => refreshDashboard()}
      />

      <Grid container spacing={3} sx={{ mb: 5 }}>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Casos Activos"
            value={stats.activeCases}
            color="#3b82f6"
          />
        </Grid>
        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Pendientes de Documentos"
            value={stats.pendingDocuments}
            subtitle="Requieren carga"
            color="#eab308"
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Casos próximos a vencer"
            value={stats.upcomingExpirations}
            subtitle={canManageTimes ? "Click para ver detalle" : "Solo Supervisores"}
            color="#ef4444"
            isClickable={canManageTimes}
            onClick={handleTimeNavigation}
          />
        </Grid>

        <Grid xs={12} sm={6} md={3}>
          <StatCard
            title="Casos Finalizados (Mes)"
            value={stats.closedMonth}
            color="#22c55e"
          />
        </Grid>
      </Grid>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* LISTA DE CASOS */}
      <Paper elevation={0} sx={{ p: 3, border: '1px solid #e2e8f0', borderRadius: 3, bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="bold">
            Mis Casos Asignados
          </Typography>
          <TextField
            size="small"
            placeholder="Buscar caso..."
            InputProps={{ endAdornment: (<InputAdornment position="end"><Search /></InputAdornment>) }}
            sx={{ width: 300, '& .MuiOutlinedInput-root': { borderRadius: 5 } }}
          />
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}><CircularProgress /></Box>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {cases.length === 0 ? (
              <Typography sx={{ textAlign: 'center', color: 'gray', py: 4 }}>No hay casos aún.</Typography>
            ) : (
              cases.map((c) => (
                <Paper
                  key={c.id} variant="outlined"
                  onClick={() => navigate(`/cases/${c.id}`)}
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: '#3b82f6',
                      backgroundColor: '#f8fafc'
                    }
                  }}>
                  <Box>
                    <Typography variant="h6" color="primary" sx={{ display: 'flex', gap: 1, fontWeight: 'bold' }}>
                      {c.caseCode} <span style={{ color: '#64748b', fontWeight: 'normal' }}>| {c.clientName}</span>
                    </Typography>

                    <Box sx={{ display: 'flex', gap: 3, mt: 1, color: '#64748b' }}>
                      {c.assignedTo && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PersonOutline fontSize="small" />
                          <Typography variant="body2">{c.assignedTo.fullName || c.assignedTo.email}</Typography>
                        </Box>
                      )}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <CalendarToday fontSize="small" />
                        <Typography variant="body2">{new Date(c.createdAt).toLocaleDateString()}</Typography>
                      </Box>
                    </Box>
                  </Box>

                  <Chip
                    label={c.status}
                    color={getStatusColor(c.status) as 'default' | 'success' | 'info' | 'warning' | 'error'}
                    sx={{ fontWeight: 'bold', borderRadius: 1, px: 1 }}
                  />
                </Paper>
              ))
            )}
          </Box>
        )}
      </Paper>
    </MainLayout>
  );
};
