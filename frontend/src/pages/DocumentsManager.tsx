import { useEffect, useState } from 'react';
import { 
  Box, 
  Paper, 
  Typography,
  TextField, 
  InputAdornment, 
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Checkbox,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import { 
  Search, 
  Check 
} from '@mui/icons-material';
import { MainLayout } from '../layouts/MainLayout';
import { api } from '../api/axios';

export interface DocumentType {
  id: string | number; 
  name: string;
  description?: string;
  isRequired: boolean;
  requiresFamily: boolean;
  relatedStates: string[];
}

export const DocumentsManager = () => {
  const [documents, setDocuments] = useState<DocumentType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const fetchDocumentTypes = async () => {
    try {
      setLoading(true);
      const { data } = await api.get<DocumentType[]>('/document-types'); 
      setDocuments(data);
    } catch (err) {
      console.error(err);
      setError('No se pudo cargar el catálogo documental.');
    } finally {
      setLoading(false);
    }
  };

  // Cargar al iniciar la pantalla
  useEffect(() => {
    fetchDocumentTypes();
  }, []);

  // --- HELPER VISUAL: Colores para los estados ---
  const getChipColor = (label: string) => {
    const text = label.toLowerCase();
    if (text.includes('listos') || text.includes('firmado') || text.includes('aprobado')) return 'success';
    if (text.includes('enviado') || text.includes('radicado')) return 'primary';
    if (text.includes('pendiente')) return 'warning';
    return 'default';
  };

  return (
    <MainLayout>
      
      {/* CABECERA */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight="800" sx={{ color: '#1e293b' }}>
          Estadisticas
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ mt: 1 }}>
          Estadistica de cada caso
        </Typography>
      </Box>

      {/* BARRA DE ACCIONES */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2 }}>
        </Box>

        <TextField 
            size="small" 
            placeholder="Buscar documento..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{ 
                endAdornment: (<InputAdornment position="end"><Search sx={{ color: 'gray' }} /></InputAdornment>),
                sx: { borderRadius: 1, bgcolor: 'white' }
            }}
            sx={{ width: 300 }}
        />
      </Box>

      {/* MANEJO DE ESTADOS DE CARGA Y ERROR */}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 5 }}>
            <CircularProgress />
        </Box>
      ) : (
        /* TABLA REAL CONECTADA */
        <Paper elevation={0} sx={{ border: '1px solid #e2e8f0', borderRadius: 3, overflow: 'hidden' }}>
            <TableContainer>
            <Table sx={{ minWidth: 650 }}>
                <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                    <TableCell padding="checkbox"><Checkbox color="primary" /></TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>CASO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>NOMBRE OPERADOR</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>TIEMPO ESTIPULADO</TableCell>
                    <TableCell align="center" sx={{ fontWeight: 'bold', color: '#64748b' }}>% DE CUMPLIMIENTO</TableCell>
                    <TableCell sx={{ fontWeight: 'bold', color: '#64748b' }}>% GESTION DEL CASO </TableCell>
                </TableRow>
                </TableHead>
                
                <TableBody>
                {documents.length === 0 ? (
                    <TableRow>
                        <TableCell colSpan={6} align="center" sx={{ py: 3, color: 'text.secondary' }}>
                            No hay casos configurados.
                        </TableCell>
                    </TableRow>
                ) : (
                    documents.map((row) => (
                        <TableRow key={row.id} hover sx={{ '&:last-child td, &:last-child th': { border: 0 } }}>
                        
                        <TableCell padding="checkbox">
                            <Checkbox color="primary" />
                        </TableCell>
                        
                        <TableCell sx={{ fontWeight: 'bold' }}>
                            {row.name}
                        </TableCell>
                        
                        <TableCell>{row.description || '-'}</TableCell>
                        
                        <TableCell align="center">
                            {/* Checkbox de solo lectura para indicar configuración */}
                            <Checkbox 
                                checked={row.isRequired} 
                                disabled 
                                checkedIcon={<Check />} 
                                color="success"
                                icon={<Box sx={{width: 20, height: 20, border: '1px solid #ccc', borderRadius: 0.5}} />}
                            />
                        </TableCell>
                        
                        <TableCell align="center">
                            <Checkbox checked={row.requiresFamily} disabled />
                        </TableCell>
                        
                        <TableCell>
                            <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                                {row.relatedStates?.map((state, index) => (
                                    <Chip 
                                        key={index} 
                                        label={state} 
                                        size="small" 
                                        variant={getChipColor(state) === 'default' ? 'filled' : 'outlined'}
                                        color={getChipColor(state) as any}
                                        sx={{ fontWeight: 500 }}
                                    />
                                ))}
                            </Box>
                        </TableCell>

                        </TableRow>
                    ))
                )}
                </TableBody>
            </Table>
            </TableContainer>
        </Paper>
      )}
    </MainLayout>
  );
};
