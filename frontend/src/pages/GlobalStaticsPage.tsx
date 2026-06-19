import { useEffect, useMemo, useState } from 'react';
import type { ReactElement } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Chip,
  LinearProgress,
  Stack,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  Alert
} from '@mui/material';
import {
  DataGrid,
  type GridColDef,
  type GridRenderCellParams
} from '@mui/x-data-grid';
import {
  FileDownload,
  Person,
  TaskAlt,
  HourglassEmpty,
  Cancel,
  CloudUpload
} from '@mui/icons-material';
import { useForm, Controller } from 'react-hook-form';
import { MainLayout } from '../layouts/MainLayout';
import type {
  CasoEstadistica,
  RequestedDocument,
  EstadoCasoEstadistica
} from '../types/statistics';
import { api } from '../api/axios';
import { calculateCaseMetrics } from '../utils/caseMetrics';
import { calculateDocumentPercentage } from '../utils/caseMetrics';

type EstadoFiltro = EstadoCasoEstadistica | 'TODOS';

interface EstadisticasFiltrosForm {
  estado: EstadoFiltro;
  encargado: string;
}

const STATUS_LABELS: Record<EstadoCasoEstadistica, string> = {
  PROCESO: 'Proceso',
  CANCELADO: 'Cancelado',
  TERMINADO: 'Terminado'
};

const STATUS_COLORS: Record<EstadoCasoEstadistica, 'warning' | 'error' | 'success'> = {
  PROCESO: 'warning',
  CANCELADO: 'error',
  TERMINADO: 'success'
};

const DOC_STATUS_CONFIG: Record<string, { icon: ReactElement; color: 'default' | 'success' | 'warning' | 'error' | 'info' }> = {
  PENDING: { icon: <HourglassEmpty fontSize="small" />, color: 'warning' },
  UPLOADED: { icon: <CloudUpload fontSize="small" />, color: 'info' },
  APPROVED: { icon: <TaskAlt fontSize="small" />, color: 'success' },
  REJECTED: { icon: <Cancel fontSize="small" />, color: 'error' }
};

const ASSIGNEE_EMPTY_LABEL = 'Sin asignar';

export const GlobalStatisticsPage = () => {
  const [rows, setRows] = useState<CasoEstadistica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { control, watch, setValue } = useForm<EstadisticasFiltrosForm>({
    defaultValues: {
      estado: 'TODOS',
      encargado: 'TODOS'
    }
  });

  const estadoSeleccionado = watch('estado');
  const encargadoSeleccionado = watch('encargado');

  const getAssigneeLabel = (value: string | null) => {
    if (!value || value.trim().length === 0) return ASSIGNEE_EMPTY_LABEL;
    return value;
  };

  const fetchStats = async () => {
    setLoading(true);
    setError('');
    try {
      const response = await api.get<CasoEstadistica[]>('/cases/global-stats');
      let cases = Array.isArray(response.data) ? response.data : [];
      
      // Cargar los documentos de cada caso (ya que global-stats no los incluye)
      cases = await Promise.all(
        cases.map(async (caseItem) => {
          try {
            const fullCase = await api.get(`/cases/${caseItem.id}`);
            console.log(`📋 Respuesta completa de /cases/${caseItem.id}:`, fullCase.data);
            
            // Intentar obtener documentos de diferentes propiedades posibles
            const docs = fullCase.data?.requestedDocuments || fullCase.data?.documents || [];
            
            return {
              ...caseItem,
              requestedDocuments: docs
            };
          } catch (err) {
            console.warn(`Error cargando documentos del caso ${caseItem.id}:`, err);
            return caseItem; // Retornar sin documentos si falla
          }
        })
      );
      
      // Calcular métricas automáticamente para cada caso
      cases = cases.map((caseItem) => {
        try {
          // Para casos cancelados, no mostrar métricas
          if (caseItem.status === 'CANCELADO') {
            return {
              ...caseItem,
              completionPercentage: NaN, // Mostrar N/A
              productivityScore: NaN
            };
          }

          // Para casos terminados, 100%
          if (caseItem.status === 'TERMINADO') {
            return {
              ...caseItem,
              completionPercentage: 100,
              productivityScore: 100
            };
          }
          
          // Para casos en PROCESO, calcular según el progreso real
          const documentsUploaded = caseItem.requestedDocuments?.filter(d => d.status === 'APPROVED' || d.status === 'UPLOADED').length || 0;
          const totalDocuments = Math.max(caseItem.requestedDocuments?.length || 0, 1);
          
          console.log(`📊 ${caseItem.clientName}: ${documentsUploaded}/${totalDocuments} documentos, estados:`, caseItem.requestedDocuments?.map(d => d.status));
          
          const metrics = calculateCaseMetrics({
            checklist: {}, // El backend debería enviar esto
            documentsUploaded,
            totalDocuments,
            createdAt: caseItem.createdAt,
            deadline: caseItem.deadline
          });
          
          console.log(`📊 ${caseItem.clientName}: Métricas = completion: ${metrics.completion}, productivity: ${metrics.productivity}`);
          
          return {
            ...caseItem,
            completionPercentage: metrics.completion,
            productivityScore: metrics.productivity
          };
        } catch (err) {
          console.warn('Error calculando métricas para caso:', caseItem.id, err);
          // Devolver valores seguros por defecto
          return {
            ...caseItem,
            completionPercentage: 0,
            productivityScore: 0
          };
        }
      });
      
      setRows(cases);
    } catch (err) {
      console.error('Error cargando estadisticas:', err);
      setError('No se pudo cargar el reporte de estadisticas.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Auto-refresh cada 30 segundos para mantener métricas actualizadas
    const interval = setInterval(fetchStats, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const encargados = useMemo(() => {
    const unique = new Set(rows.map((row) => getAssigneeLabel(row.assignedUserName)));
    return ['TODOS', ...Array.from(unique)];
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const matchEstado = estadoSeleccionado === 'TODOS' || row.status === estadoSeleccionado;
      const matchEncargado = encargadoSeleccionado === 'TODOS' || getAssigneeLabel(row.assignedUserName) === encargadoSeleccionado;
      return matchEstado && matchEncargado;
    });
  }, [estadoSeleccionado, encargadoSeleccionado, rows]);

  const columns: GridColDef<CasoEstadistica>[] = [
    {
      field: 'clientName',
      headerName: 'Cliente',
      flex: 1.2,
      minWidth: 220,
      renderCell: (params: GridRenderCellParams<CasoEstadistica, string>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Person color="action" fontSize="small" />
          <Typography variant="subtitle2" fontWeight="bold">
            {params.value}
          </Typography>
        </Box>
      )
    },
    {
      field: 'assignedUserName',
      headerName: 'Encargado',
      flex: 1,
      minWidth: 200,
      renderCell: (params: GridRenderCellParams<CasoEstadistica, string | null>) => (
        <Typography variant="body2" color={params.value ? 'text.primary' : 'text.secondary'}>
          {getAssigneeLabel(params.value ?? null)}
        </Typography>
      )
    },
    {
      field: 'status',
      headerName: 'Estado',
      flex: 0.7,
      minWidth: 160,
      renderCell: (params: GridRenderCellParams<CasoEstadistica, EstadoCasoEstadistica>) => {
        const value: EstadoCasoEstadistica = params.value ?? 'PROCESO';
        return (
          <Chip
            label={STATUS_LABELS[value]}
            size="small"
            color={STATUS_COLORS[value]}
            variant="filled"
            sx={{ fontWeight: 'bold' }}
          />
        );
      }
    },
    {
      field: 'completionPercentage',
      headerName: 'Cumplimiento',
      flex: 1,
      minWidth: 220,
      renderCell: (params: GridRenderCellParams<CasoEstadistica, number>) => {
        const value = params.value ?? 0;
        const caseStatus = params.row.status;
        
        // Para casos cancelados, mostrar N/A
        if (caseStatus === 'CANCELADO' || isNaN(value)) {
          return (
            <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={0}
                sx={{
                  flex: 1,
                  height: 8,
                  borderRadius: 5,
                  bgcolor: '#f3f4f6'
                }}
              />
              <Typography variant="body2" color="text.disabled" sx={{ minWidth: 40, textAlign: 'right' }}>
                N/A
              </Typography>
            </Box>
          );
        }
        
        const safeValue = Math.min(Math.max(value, 0), 100);
        let color = '#ef4444'; // Rojo
        if (safeValue >= 75) color = '#22c55e'; // Verde
        else if (safeValue >= 40) color = '#f59e0b'; // Amarillo
        
        return (
          <Box sx={{ width: '100%', display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={safeValue}
              sx={{
                flex: 1,
                height: 8,
                borderRadius: 5,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: color
                }
              }}
            />
            <Typography variant="body2" fontWeight="bold" color={color} sx={{ minWidth: 40, textAlign: 'right' }}>
              {safeValue}%
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'productivityScore',
      headerName: 'Productividad',
      flex: 0.8,
      minWidth: 140,
      renderCell: (params: GridRenderCellParams<CasoEstadistica, number>) => {
        const value = params.value ?? 0;
        const caseStatus = params.row.status;
        
        // Para casos cancelados, mostrar N/A
        if (caseStatus === 'CANCELADO' || isNaN(value)) {
          return (
            <Typography variant="body2" color="text.disabled">
              N/A
            </Typography>
          );
        }
        
        const safeValue = Math.min(Math.max(value, 0), 100);
        let color = 'error.main';
        if (safeValue >= 80) color = 'success.main';
        else if (safeValue >= 60) color = 'warning.main';
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={safeValue}
              sx={{
                width: 60,
                height: 6,
                borderRadius: 3,
                bgcolor: '#e5e7eb',
                '& .MuiLinearProgress-bar': {
                  bgcolor: color === 'success.main' ? '#22c55e' : color === 'warning.main' ? '#f59e0b' : '#ef4444'
                }
              }}
            />
            <Typography variant="body2" fontWeight="bold" color={color}>
              {safeValue}%
            </Typography>
          </Box>
        );
      }
    },
    {
      field: 'requestedDocuments',
      headerName: 'Progreso Doc.',
      flex: 0.7,
      minWidth: 140,
      sortable: false,
      renderCell: (params: GridRenderCellParams<CasoEstadistica, RequestedDocument[]>) => {
        const docs = params.value ?? [];
        const caseStatus = params.row.status;
        
        // Para casos cancelados, mostrar N/A
        if (caseStatus === 'CANCELADO') {
          return (
            <Typography variant="body2" color="text.disabled">
              N/A
            </Typography>
          );
        }
        
        // Para casos terminados, mostrar 100%
        if (caseStatus === 'TERMINADO') {
          return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <LinearProgress
                variant="determinate"
                value={100}
                sx={{
                  width: 50,
                  height: 6,
                  borderRadius: 3,
                  bgcolor: '#e2e8f0',
                  '& .MuiLinearProgress-bar': {
                    bgcolor: '#22c55e'
                  }
                }}
              />
              <Typography variant="body2" fontWeight="bold" color="#22c55e" sx={{ minWidth: 35, textAlign: 'right' }}>
                100%
              </Typography>
            </Box>
          );
        }
        
        const docPercentage = calculateDocumentPercentage(docs);
        
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <LinearProgress
              variant="determinate"
              value={Math.min(docPercentage, 100)}
              sx={{
                width: 50,
                height: 6,
                borderRadius: 3,
                bgcolor: '#e2e8f0',
                '& .MuiLinearProgress-bar': {
                  bgcolor: docPercentage >= 80 ? '#22c55e' : docPercentage >= 40 ? '#f59e0b' : '#ef4444'
                }
              }}
            />
            <Tooltip title={`${docs.filter(d => d.status === 'APPROVED' || d.status === 'UPLOADED').length}/${docs.length} listos`}>
              <Typography 
                variant="body2" 
                fontWeight="bold" 
                sx={{ 
                  minWidth: 35, 
                  textAlign: 'right',
                  color: docPercentage >= 80 ? '#22c55e' : docPercentage >= 40 ? '#f59e0b' : '#ef4444'
                }}
              >
                {docPercentage}%
              </Typography>
            </Tooltip>
          </Box>
        );
      }
    },
    {
      field: 'documentos',
      headerName: 'Documentos',
      flex: 2,
      minWidth: 400,
      sortable: false,
      renderCell: (params: GridRenderCellParams<CasoEstadistica, RequestedDocument[]>) => {
        const docs = params.row.requestedDocuments ?? [];
        const caseStatus = params.row.status;
        
        // Para casos cancelados, mostrar N/A
        if (caseStatus === 'CANCELADO') {
          return (
            <Typography variant="body2" color="text.disabled">
              N/A
            </Typography>
          );
        }
        
        // Para casos terminados, mostrar mensaje
        if (caseStatus === 'TERMINADO') {
          return (
            <Chip label="Completado" color="success" variant="filled" />
          );
        }
        
        return (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 0.5,
            maxHeight: '100%',
            overflowY: 'auto',
            pr: 1,
            py: 0.5,
            '&::-webkit-scrollbar': {
              width: '6px'
            },
            '&::-webkit-scrollbar-track': {
              bgcolor: 'transparent'
            },
            '&::-webkit-scrollbar-thumb': {
              bgcolor: '#cbd5e1',
              borderRadius: '3px',
              '&:hover': {
                bgcolor: '#94a3b8'
              }
            }
          }}>
            {docs.map((doc, index) => {
              const config = DOC_STATUS_CONFIG[doc.status];
              return (
                <Tooltip key={`${doc.name}-${doc.status}-${index}`} title={doc.name} arrow>
                  <Chip
                    icon={config.icon}
                    label={doc.name}
                    size="small"
                    color={config.color}
                    variant={doc.status === 'APPROVED' || doc.status === 'REJECTED' ? 'filled' : 'outlined'}
                  />
                </Tooltip>
              );
            })}
          </Box>
        );
      }
    }
  ];

  return (
    <MainLayout>
      <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" fontWeight="bold" sx={{ color: '#1e293b' }}>
            Estadísticas
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Visibilidad de cumplimiento y productividad por caso.
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<FileDownload />} sx={{ px: 3, py: 1, borderRadius: 2 }}>
          Exportar Reporte
        </Button>
      </Box>

      <Paper sx={{ mb: 3, p: 2, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, alignItems: 'center', justifyContent: 'space-between' }}>
          <Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
            <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
              Estado:
            </Typography>
            {(['TODOS', 'PROCESO', 'CANCELADO', 'TERMINADO'] as EstadoFiltro[]).map((estado) => (
              <Chip
                key={estado}
                label={estado === 'TODOS' ? 'Todos' : STATUS_LABELS[estado]}
                color={estado === 'TODOS' ? 'default' : STATUS_COLORS[estado as EstadoCasoEstadistica]}
                variant={estadoSeleccionado === estado ? 'filled' : 'outlined'}
                onClick={() => setValue('estado', estado)}
                clickable
                sx={{ fontWeight: 600 }}
              />
            ))}
          </Stack>

          <FormControl size="small" sx={{ minWidth: 220, bgcolor: 'white' }}>
            <InputLabel>Encargado</InputLabel>
            <Controller
              name="encargado"
              control={control}
              render={({ field }) => (
                <Select {...field} label="Encargado">
                  {encargados.map((name) => (
                    <MenuItem key={name} value={name}>
                      {name}
                    </MenuItem>
                  ))}
                </Select>
              )}
            />
          </FormControl>
        </Box>
      </Paper>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Paper sx={{ p: 2, borderRadius: 3, border: '1px solid #e2e8f0' }}>
        <DataGrid
          rows={filteredRows}
          columns={columns}
          disableRowSelectionOnClick
          autoHeight
          rowHeight={130}
          loading={loading}
          pageSizeOptions={[5, 10, 25]}
          initialState={{
            pagination: { paginationModel: { pageSize: 10 } }
          }}
          sx={{
            border: 'none',
            '& .MuiDataGrid-columnHeaders': {
              bgcolor: '#f8fafc',
              color: '#475569',
              fontWeight: 'bold'
            },
            '& .MuiDataGrid-cell': {
              alignItems: 'center'
            }
          }}
        />
      </Paper>
    </MainLayout>
  );
};
