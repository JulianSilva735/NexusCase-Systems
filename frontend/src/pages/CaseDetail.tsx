import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Paper,
  CircularProgress,
  Chip,
  IconButton,
  Tooltip,
} from '@mui/material';
import { ArrowBack, Cancel, CheckCircle, History as HistoryIcon, InfoOutlined, Settings } from '@mui/icons-material';

import { MainLayout } from '../layouts/MainLayout';
import { api } from '../api/axios';
import { CaseService } from '../services/case.service';

import { GeneralDataTab } from '../components/case-tabs/GeneralDataTab';
import { RelativesTab } from '../components/case-tabs/RelativesTab';
import { SurveyTab } from '../components/case-tabs/SurveyTab';
import { DocumentsTab } from '../components/case-tabs/DocumentsTab';

import { CaseHistoryDrawer } from '../components/drawers/CaseHistoryDrawer';
import { ClientTechnicalSheet } from '../components/drawers/ClientTechnicalSheet';
import { CancelCaseDialog } from '../components/modals/CancelCaseDialog';
import { CaseLifecycleTimeline } from '../components/CaseLifecycleTimeline';
import { ManualOverrideModal } from '../components/ManualOverrideModal';
import {
  useCaseLifecycle,
  useManualLifecycleOverride,
  useRecalculateLifecycle,
  useWorkflowStages,
} from '../hooks/useLifecycle';

/**
 * PÁGINA: CaseDetail
 * 
 * Vista compleja que muestra TODA la información de un caso.
 * Usa un sistema de Pestañas (Tabs) para organizar la información (Datos, Familiares, Documentos...).
 */
export const CaseDetail = () => {
  // useParams: Hook de React Router para leer parámetros de la URL.
  // Si la ruta es "/cases/15", entonces "id" valdrá "15".
  const { id } = useParams();
  const navigate = useNavigate();

  // Estado para saber en qué pestaña está el usuario (0 = Datos, 1 = Familiares, etc.)
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // Spinner en botones

  // Estados de Modals/Drawers (Ventanas emergentes)
  const [historyOpen, setHistoryOpen] = useState(false);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [techSheetOpen, setTechSheetOpen] = useState(false);
  const [manualOverrideOpen, setManualOverrideOpen] = useState(false);

  const [caseData, setCaseData] = useState<any>(null);

  const workflowStagesQuery = useWorkflowStages();
  const lifecycleQuery = useCaseLifecycle(id);
  const recalculateLifecycleMutation = useRecalculateLifecycle(id);
  const manualLifecycleOverrideMutation = useManualLifecycleOverride(id);

  const userRole = (() => {
    try {
      const rawUser = localStorage.getItem('user');
      if (!rawUser) return '';
      const parsed = JSON.parse(rawUser) as { role?: string };
      return (parsed.role || '').toUpperCase();
    } catch {
      return '';
    }
  })();

  const canManageManualOverride = userRole === 'ADMINISTRADOR' || userRole === 'SUPERVISOR';

  /**
   * Carga los datos frescos del servidor.
   * Se llama al entrar a la página y cada vez que hacemos un cambio importante (ej. subir documento).
   */
  const fetchCaseData = async () => {
    try {
      if (!id) return;
      const caseResponse = await api.get(`/cases/${id}`);

      setCaseData(caseResponse.data);
    } catch (error) {
      console.error("Error cargando el caso:", error);
    }
  };

  const syncLifecycleAutomatically = async () => {
    if (!id) return;
    try {
      await recalculateLifecycleMutation.mutateAsync();
    } catch (error) {
      console.warn('No se pudo recalcular lifecycle automaticamente:', error);
    }
  };

  const refreshCaseAndLifecycle = async () => {
    await fetchCaseData();
    await syncLifecycleAutomatically();
    await lifecycleQuery.refetch();
  };

  // Callback para SurveyTab: actualiza datos y cambia a pestaña de Documentos
  const handleSurveyUpdate = async () => {
    await refreshCaseAndLifecycle();
    setActiveTab(3); // Cambia a pestaña Documentos
  };

  /**
   * useEffect: Se ejecuta una sola vez al cargar la página (gracias al [id]).
   * Es el lugar estándar para pedir los datos iniciales.
   */
  useEffect(() => {
    const init = async () => {
      try {
        await fetchCaseData();
        await syncLifecycleAutomatically();
      } finally {
        setLoading(false); // Apaga el spinner, haya o no error
      }
    };
    if (id) init();
  }, [id]);

  // --- LÓGICA PARA CANCELAR EL CASO ---
  const handleCancelConfirm = async (reason: string) => {
    if (!id) return;

    try {
      setActionLoading(true);
      const refreshedCase = await CaseService.cancelCase(id, reason);
      setCaseData(refreshedCase);
      await refreshCaseAndLifecycle();

      setCancelOpen(false);
      alert('Caso cancelado correctamente.');
      navigate('/dashboard');
    } catch (error) {
      console.error("Error cancelando", error);
      alert('Hubo un error al intentar cancelar el caso.');
    } finally {
      setActionLoading(false);
    }
  };

  // --- NUEVA LÓGICA: FINALIZAR / GUARDAR TODO ---
  const handleFinishCase = async () => {
    // 1. Confirmación de seguridad
    const confirm = window.confirm(
      "¿Estás seguro de que deseas FINALIZAR este caso?\n\nAl confirmar, el caso pasará a estado 'FINALIZADO' y se entenderá que toda la gestión ha concluido."
    );
    if (!confirm) return;

    try {
      setActionLoading(true);

      // 2. Enviamos la actualización al Backend
      // Asumimos que tu backend recibe un PATCH en /cases/:id con el nuevo status
      await api.patch(`/cases/${id}`, { status: 'FINALIZADO' });

      alert("¡Caso finalizado y guardado exitosamente!");

      // 3. Recargamos la data para ver el cambio de estado visualmente
      await refreshCaseAndLifecycle();

    } catch (error) {
      console.error("Error al finalizar el caso:", error);
      alert("Ocurrió un error al intentar finalizar el caso. Por favor, intente nuevamente.");
    } finally {
      setActionLoading(false);
    }
  };

  const lifecycleErrorMessage = lifecycleQuery.error ? 'No se pudo cargar el lifecycle.' : undefined;

  if (loading) return <MainLayout><Box sx={{ display: 'flex', justifyContent: 'center', mt: 5 }}><CircularProgress /></Box></MainLayout>;
  if (!caseData) return <MainLayout><Typography variant="h6" color="error">Caso no encontrado</Typography></MainLayout>;

  return (
    <MainLayout>
      {/* --- HEADER SUPERIOR --- */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button startIcon={<ArrowBack />} onClick={() => navigate('/dashboard')} sx={{ color: 'text.secondary' }}>
            Volver
          </Button>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h5" fontWeight="bold">
              {caseData.caseCode} <span style={{ fontWeight: 'normal', color: 'gray' }}>| {caseData.clientName}</span>
            </Typography>

            <Tooltip title="Ver Ficha Técnica del Ciudadano">
              <IconButton onClick={() => setTechSheetOpen(true)} color="primary" size="small">
                <InfoOutlined />
              </IconButton>
            </Tooltip>
          </Box>

          <Chip label={caseData.status} color="primary" size="small" sx={{ fontWeight: 'bold' }} />
        </Box>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Tooltip title="Ver Historial">
            <IconButton onClick={() => setHistoryOpen(true)} sx={{ bgcolor: 'white', border: '1px solid #e2e8f0' }}>
              <HistoryIcon color="action" />
            </IconButton>
          </Tooltip>

          <Button
            variant="outlined"
            color="error"
            startIcon={<Cancel />}
            onClick={() => setCancelOpen(true)}
            disabled={caseData.status === 'CANCELADO' || caseData.status === 'FINALIZADO' || actionLoading}
          >
            Cancelar Caso
          </Button>

          {/* --- BOTÓN GUARDAR TODO / FINALIZAR (CORREGIDO) --- */}
          <Button
            variant="contained"
            color="success"
            startIcon={actionLoading ? <CircularProgress size={20} color="inherit" /> : <CheckCircle />}
            onClick={handleFinishCase}
            disabled={caseData.status === 'CANCELADO' || caseData.status === 'FINALIZADO' || actionLoading}
          >
            {caseData.status === 'FINALIZADO' ? 'Caso Finalizado' : 'Finalizar Caso'}
          </Button>

          {canManageManualOverride && (
            <Button
              variant="outlined"
              startIcon={<Settings />}
              onClick={() => setManualOverrideOpen(true)}
              disabled={manualLifecycleOverrideMutation.isPending}
            >
              Override Manual
            </Button>
          )}
        </Box>
      </Box>

      <Box sx={{ mb: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <CaseLifecycleTimeline
          workflowStages={workflowStagesQuery.data || []}
          lifecycle={lifecycleQuery.data}
          loading={workflowStagesQuery.isLoading || lifecycleQuery.isLoading}
          error={workflowStagesQuery.isError ? 'No se pudo cargar workflow stages.' : lifecycleErrorMessage}
        />
      </Box>

      {/* --- CONTENEDOR PRINCIPAL DE PESTAÑAS --- */}
      <Paper sx={{ width: '100%', borderRadius: 2, overflow: 'hidden' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} variant="scrollable" scrollButtons="auto">
            <Tab label="Datos Titular" />
            <Tab label={`Familiares (${caseData.relatives?.length || 0})`} />
            <Tab label="Encuesta Única" />
            <Tab label="Documentos" />
          </Tabs>
        </Box>

        <Box sx={{ minHeight: 400, bgcolor: 'white' }}>
          {/* Tab 0: Datos */}
          {activeTab === 0 && <GeneralDataTab caseData={caseData} onUpdate={refreshCaseAndLifecycle} />}

          {/* Tab 1: Familiares */}
          {activeTab === 1 && (
            <RelativesTab
              caseData={caseData}
              relatives={caseData?.relatives || []}
              onUpdate={refreshCaseAndLifecycle}
            />
          )}

          {/* Tab 2: Encuesta */}
          {activeTab === 2 && (
            <SurveyTab
              caseId={caseData.id}
              initialData={caseData.surveyAnswers}
              onUpdate={handleSurveyUpdate}
            />
          )}

          {/* Tab 3: Documentos */}
          {activeTab === 3 && (
            <DocumentsTab
              caseData={caseData}
              active={activeTab === 3}
              onUpdate={refreshCaseAndLifecycle}
            />
          )}
        </Box>
      </Paper>

      {/* --- MODALES Y DRAWERS --- */}
      <CaseHistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        history={caseData.history || []}
        caseId={caseData.id}
        onCommentAdded={refreshCaseAndLifecycle}
      />

      <CancelCaseDialog
        open={cancelOpen}
        onClose={() => setCancelOpen(false)}
        onConfirm={handleCancelConfirm}
      />

      <ClientTechnicalSheet
        open={techSheetOpen}
        onClose={() => setTechSheetOpen(false)}
        caseData={caseData}
      />

      <ManualOverrideModal
        open={manualOverrideOpen}
        onClose={() => setManualOverrideOpen(false)}
        caseId={id}
        workflowStages={workflowStagesQuery.data || []}
      />

    </MainLayout>
  );
};
