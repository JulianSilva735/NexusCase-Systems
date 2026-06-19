import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import type { LifecycleHistoryItem } from '../types/lifecycle';

interface Props {
  history?: LifecycleHistoryItem[];
  loading?: boolean;
  error?: string;
}

const formatStage = (value?: string | null) => value || 'N/A';

export const LifecycleHistoryPanel = ({ history, loading, error }: Props) => {
  if (loading) {
    return (
      <Paper sx={{ p: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <CircularProgress size={20} />
          <Typography variant="body2" color="text.secondary">Cargando historial lifecycle...</Typography>
        </Box>
      </Paper>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  if (!history || history.length === 0) {
    return <Alert severity="info">No hay eventos de lifecycle para este caso.</Alert>;
  }

  return (
    <Paper sx={{ p: 1.5, borderRadius: 2, border: '1px solid #e2e8f0' }}>
      <Typography variant="subtitle1" fontWeight="bold" sx={{ mb: 1 }}>
        Historial Lifecycle
      </Typography>

      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell><strong>Fecha</strong></TableCell>
              <TableCell><strong>Desde</strong></TableCell>
              <TableCell><strong>Hacia</strong></TableCell>
              <TableCell><strong>Fuente</strong></TableCell>
              <TableCell><strong>Motivo</strong></TableCell>
              <TableCell><strong>Usuario</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {history.map((item, index) => (
              <TableRow key={item.id || `${item.changed_at}-${item.to_stage}-${index}`}>
                <TableCell>{new Date(item.changed_at).toLocaleString()}</TableCell>
                <TableCell>{formatStage(item.from_stage)}</TableCell>
                <TableCell>{formatStage(item.to_stage)}</TableCell>
                <TableCell>{item.source}</TableCell>
                <TableCell>{item.reason || 'N/A'}</TableCell>
                <TableCell>{item.user_id || 'Sistema'}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Paper>
  );
};
