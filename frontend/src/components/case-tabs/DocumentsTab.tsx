import { useState, useEffect, useCallback } from 'react';
import {
    Box, Typography, Button, TableContainer, Paper, Table, TableHead,
    TableRow, TableCell, TableBody, Chip, Tooltip, IconButton, CircularProgress,
    Dialog, DialogTitle, DialogContent, DialogActions, MenuItem, Select, InputLabel, FormControl
} from '@mui/material';
import {
    CloudUpload, Visibility, CheckCircle, Delete as DeleteIcon, AddCircleOutline, Edit as EditIcon
} from '@mui/icons-material';
import { api } from '../../api/axios';
import { documentTypesService, type DocumentType } from '../../services/documentTypes.service';
import type { Case } from '../../types/case';


interface DocumentsTabProps {
    caseData: Case;
    active: boolean;
    onUpdate?: () => void | Promise<void>;
}

export const DocumentsTab = ({ caseData, active, onUpdate }: DocumentsTabProps) => {

    const [documents, setDocuments] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uploadingDocId, setUploadingDocId] = useState<string | null>(null);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

    // --- ESTADOS PARA EL MODAL DE CARGA MANUAL ---
    const [openModal, setOpenModal] = useState(false);
    const [manualType, setManualType] = useState('');
    const [manualFile, setManualFile] = useState<File | null>(null);
    const [isManualUploading, setIsManualUploading] = useState(false);

    // 1. Cargar tipos de documentos desde la API
    const fetchDocumentTypes = useCallback(async () => {
        try {
            const types = await documentTypesService.getAll();
            setDocumentTypes(types.filter(type => type.isActive));
        } catch (error) {
            console.error("Error cargando tipos de documentos:", error);
            setDocumentTypes([]);
        }
    }, []);

    // 2. Cargar documentos desde la API al montar
    const fetchDocuments = useCallback(async () => {
        try {
            setLoading(true);

            const response = await api.get(`/documents/case/${caseData.id}`, {
                headers: {
                    "Cache-Control": "no-cache",
                    "Pragma": "no-cache",
                    "Expires": "0"
                }
            });

            setDocuments(Array.isArray(response.data) ? response.data : []);
        } catch (error) {
            console.error("Error cargando documentos:", error);
        } finally {
            setLoading(false);
        }
    }, [caseData?.id]);


    useEffect(() => {
        fetchDocumentTypes();
    }, []);

    useEffect(() => {
        if (!active) return;
        if (!caseData?.id) return;
        fetchDocuments();
    }, [active, caseData?.id]);

    // 2. Funciones de Ayuda
    const handleView = (path: string | undefined) => {
        if (!path) return;
        let cleanPath = path;
        const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000';
        if (path.includes('uploads')) {
            const parts = path.split('uploads');
            if (parts.length > 1) cleanPath = '/uploads' + parts[1];
        }
        cleanPath = cleanPath.replace(/\\/g, '/');
        if (!cleanPath.startsWith('/')) cleanPath = `/${cleanPath}`;
        const fullUrl = `${baseUrl}${cleanPath}`;
        window.open(fullUrl, '_blank');
    };

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>, doc: any) => {
        const file = event.target.files?.[0];
        if (!file) return;

        if (file.size > 5 * 1024 * 1024) {
            alert("El archivo es demasiado grande (Máx 5MB)");
            return;
        }

        try {
            setUploadingDocId(doc.id);
            const formData = new FormData();
            formData.append('file', file);
            formData.append('docName', doc.name); // Enviamos el nombre para consistencia
            // Opcional: si el backend soporta recibir el ID para actualizar
            if (doc.id) formData.append('documentId', doc.id);

            // Usamos endpoint de subida general
            await api.post(`/cases/${caseData.id}/documents`, formData);

            // Recargamos la lista desde el backend
            await fetchDocuments();
            if (onUpdate) await onUpdate();

        } catch (error) {
            console.error("Error al subir archivo", error);
            alert("Error al subir el documento.");
        } finally {
            setUploadingDocId(null);
        }
    };

    const handleDelete = async (docId: string) => {
        if (!window.confirm("¿Estás seguro de que deseas eliminar este documento?")) return;
        try {
            await api.delete(`/documents/${docId}`);
            // Recargamos la lista
            await fetchDocuments();
            if (onUpdate) await onUpdate();
        } catch (error) {
            console.error(error);
            alert("Error al eliminar el documento.");
        }
    };

    // Subida Manual de Adicionales
    const handleManualSubmit = async () => {
        if (!manualFile || !manualType) return;
        setIsManualUploading(true);
        try {
            const formData = new FormData();
            formData.append('file', manualFile);
            formData.append('docName', manualType);

            await api.post(`/cases/${caseData.id}/documents`, formData);

            setOpenModal(false);
            setManualFile(null);
            setManualType('');

            await fetchDocuments();
            if (onUpdate) await onUpdate();

        } catch (error) {
            console.error(error);
            alert("Error al subir documento adicional.");
        } finally {
            setIsManualUploading(false);
        }
    };

    if (loading && documents.length === 0) {
        return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;
    }

    return (
        <Box sx={{ p: 3 }}>

            {/* Cabecera */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight="bold">
                    Expediente Digital
                </Typography>
                <Button
                    variant="contained"
                    color="secondary"
                    startIcon={<AddCircleOutline />}
                    onClick={() => setOpenModal(true)}
                    size="small"
                >
                    Agregar Adicional
                </Button>
            </Box>

            {/* Tabla Unificada */}
            <TableContainer component={Paper} variant="outlined" sx={{ mb: 4 }}>
                <Table>
                    <TableHead sx={{ bgcolor: '#f8fafc' }}>
                        <TableRow>
                            <TableCell><strong>Documento</strong></TableCell>
                            <TableCell><strong>Estado</strong></TableCell>
                            <TableCell align="center"><strong>Acción</strong></TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {documents.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={3} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                                    No hay documentos requeridos ni cargados.
                                </TableCell>
                            </TableRow>
                        ) : (
                            documents.map((doc) => {
                                const isUploading = uploadingDocId === doc.id;
                                // Estado visual
                                let estadoLabel = '';
                                let estadoColor = 'default';
                                let estadoIcon = null;
                                if (doc.status === 'UPLOADED' || doc.status === 'APPROVED') {
                                    estadoLabel = doc.status === 'APPROVED' ? 'Aprobado' : 'Cargado';
                                    estadoColor = 'success';
                                    estadoIcon = <CheckCircle />;
                                } else if (doc.status === 'PENDING') {
                                    estadoLabel = 'Pendiente';
                                    estadoColor = 'warning';
                                } else if (doc.status === 'REJECTED') {
                                    estadoLabel = 'Rechazado';
                                    estadoColor = 'error';
                                }
                                return (
                                    <TableRow key={doc.id} hover>
                                        <TableCell>
                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                                {doc.name}
                                                {doc.required && (
                                                    <Chip label="Requerido" color="warning" size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                                                )}
                                                {!doc.required && doc.type !== 'REQUIRED' && (
                                                    <Chip label="Adicional" color="default" size="small" sx={{ fontSize: '0.6rem', height: 20 }} />
                                                )}
                                            </Box>
                                        </TableCell>
                                        <TableCell>
                                            <Chip
                                                icon={estadoIcon ? estadoIcon : undefined}
                                                label={estadoLabel}
                                                color={
                                                    estadoColor === 'success' ? 'success' :
                                                    estadoColor === 'error' ? 'error' :
                                                    estadoColor === 'warning' ? 'warning' :
                                                    estadoColor === 'primary' ? 'primary' :
                                                    estadoColor === 'secondary' ? 'secondary' :
                                                    estadoColor === 'info' ? 'info' :
                                                    'default'
                                                }
                                                size="small"
                                            />
                                            {doc.status === 'REJECTED' && doc.rejectionReason && (
                                                <Typography variant="caption" color="error" sx={{ ml: 1 }}>{doc.rejectionReason}</Typography>
                                            )}
                                        </TableCell>
                                        <TableCell align="center">
                                            {isUploading ? (
                                                <CircularProgress size={24} />
                                            ) : (
                                                <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
                                                    {/* Acciones según estado */}
                                                    {doc.status === 'PENDING' && (
                                                        <Button
                                                            component="label"
                                                            size="small"
                                                            variant="contained"
                                                            startIcon={<CloudUpload />}
                                                        >
                                                            Subir
                                                            <input
                                                                type="file"
                                                                hidden
                                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                                onChange={(e) => handleUpload(e, doc)}
                                                            />
                                                        </Button>
                                                    )}
                                                    {(doc.status === 'UPLOADED' || doc.status === 'APPROVED') && (
                                                        <>
                                                            <Tooltip title="Ver Documento">
                                                                <IconButton color="primary" onClick={() => handleView(doc.path || doc.url)}>
                                                                    <Visibility />
                                                                </IconButton>
                                                            </Tooltip>
                                                            <Tooltip title="Reemplazar archivo">
                                                                <IconButton component="label" color="primary">
                                                                    <EditIcon />
                                                                    <input
                                                                        type="file"
                                                                        hidden
                                                                        accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                                        onChange={(e) => handleUpload(e, doc)}
                                                                    />
                                                                </IconButton>
                                                            </Tooltip>
                                                        </>
                                                    )}
                                                    {doc.status === 'REJECTED' && (
                                                        <Button
                                                            component="label"
                                                            size="small"
                                                            variant="contained"
                                                            color="error"
                                                            startIcon={<CloudUpload />}
                                                        >
                                                            Subir Nuevo
                                                            <input
                                                                type="file"
                                                                hidden
                                                                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                                                                onChange={(e) => handleUpload(e, doc)}
                                                            />
                                                        </Button>
                                                    )}
                                                    {/* Permitir borrar en cualquier estado */}
                                                    <Tooltip title="Eliminar">
                                                        <IconButton color="error" onClick={() => handleDelete(doc.id)}>
                                                            <DeleteIcon />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Box>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

            {/* Modal Agregar Adicional */}
            <Dialog open={openModal} onClose={() => setOpenModal(false)} maxWidth="sm" fullWidth>
                <DialogTitle>Agregar Documento Adicional</DialogTitle>
                <DialogContent>
                    <Box sx={{ mt: 1, display: 'flex', flexDirection: 'column', gap: 3 }}>
                        <Typography variant="body2" color="text.secondary">
                            Seleccione el tipo de documento y suba el archivo.
                        </Typography>

                        <FormControl fullWidth>
                            <InputLabel>Tipo de Documento</InputLabel>
                            <Select
                                value={manualType}
                                label="Tipo de Documento"
                                onChange={(e) => setManualType(e.target.value)}
                            >
                                {documentTypes.map((docType) => (
                                    <MenuItem key={docType.id} value={docType.name}>{docType.name}</MenuItem>
                                ))}
                            </Select>
                        </FormControl>

                        <Button
                            variant="outlined"
                            component="label"
                            fullWidth
                            sx={{ height: 56, borderStyle: 'dashed' }}
                            startIcon={manualFile ? <CheckCircle color="success" /> : <CloudUpload />}
                        >
                            {manualFile ? manualFile.name : "Seleccionar Archivo"}
                            <input
                                type="file"
                                hidden
                                accept=".pdf,.jpg,.jpeg,.png"
                                onChange={(e) => setManualFile(e.target.files?.[0] || null)}
                            />
                        </Button>
                    </Box>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setOpenModal(false)} color="inherit">Cancelar</Button>
                    <Button
                        onClick={handleManualSubmit}
                        variant="contained"
                        disabled={!manualType || !manualFile || isManualUploading}
                    >
                        {isManualUploading ? "Subiendo..." : "Guardar"}
                    </Button>
                </DialogActions>
            </Dialog>
        </Box>
    );
};
