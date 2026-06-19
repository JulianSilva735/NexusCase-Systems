import { useEffect, useState } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import {
    Box, Typography, Paper, Button, IconButton, Chip, Dialog, DialogTitle, DialogContent,
    DialogActions, TextField, MenuItem, Switch, FormControlLabel, Grid, Collapse,
    FormControl, InputLabel, Select, Alert
} from '@mui/material';

import {
    Add, Edit, Delete, DragIndicator, ExpandMore
} from '@mui/icons-material';
import { MainLayout } from '../../layouts/MainLayout';
import { SurveyService } from '../../services/survey.service';
import { documentTypesService } from '../../services/documentTypes.service';
import { QUESTION_TYPES } from '../../types/survey';
import type { SurveyConfig, SurveyQuestion } from '../../types/survey';
interface DocumentType {
    id: string;
    name: string;
}

const QuestionItem = ({ field, index, onEdit, onRemove }: { field: SurveyQuestion; index: number; onEdit: () => void; onRemove: () => void }) => {
    const [expanded, setExpanded] = useState(false);

    return (
        <Paper variant="outlined" sx={{ mb: 1, overflow: 'hidden' }}>
            <Box sx={{ p: 1, pl: 2, display: 'flex', alignItems: 'center', gap: 2, bgcolor: '#f8fafc' }}>
                <DragIndicator color="action" />
                <Typography fontWeight="bold">P{index + 1}. {field.statement || "(Sin texto)"}</Typography>

                <Chip label={QUESTION_TYPES.find(t => t.value === field.inputType)?.label || field.inputType} size="small" color="primary" variant="outlined" />
                {field.required && <Chip label="Obligatoria" size="small" color="error" />}

                <Box sx={{ flexGrow: 1 }} />

                <IconButton size="small" onClick={onEdit} title="Editar">
                    <Edit fontSize="small" />
                </IconButton>
                <IconButton size="small" color="error" onClick={onRemove} title="Eliminar">
                    <Delete fontSize="small" />
                </IconButton>
                <IconButton
                    size="small"
                    onClick={() => setExpanded(!expanded)}
                    sx={{ transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: '0.3s' }}
                >
                    <ExpandMore />
                </IconButton>
            </Box>

            <Collapse in={expanded} timeout="auto" unmountOnExit>
                <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
                    <Typography variant="body2" color="text.secondary">ID: {field.id}</Typography>
                    {/* Solo mostramos opciones si es YES_NO o SELECT */}
                    {(field.inputType === 'BOOLEAN') && field.options && field.options.length > 0 && (
                        <Box sx={{ mt: 1, p: 2, bgcolor: '#f9f9f9', borderRadius: 1 }}>
                            <Typography variant="caption" fontWeight="bold">Opciones configuradas:</Typography>
                            {field.options.map((opt, i) => (
                                <Box key={opt.id || i} sx={{ display: 'flex', gap: 1, mt: 0.5 }}>
                                    <Typography variant="body2">• {opt.label}</Typography>
                                    {opt.requiresDocument && <Chip label="Pide Documento" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />}
                                </Box>
                            ))}
                        </Box>
                    )}
                </Box>
            </Collapse>
        </Paper>
    );
};

export const SurveyConfigEditor = () => {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const { control, reset, watch, getValues } = useForm<SurveyConfig>({
        defaultValues: {
            title: '',
            description: '',
            questions: [],
            isActive: true
        }
    });

    const { fields, append, remove, update } = useFieldArray({
        control,
        name: "questions",
        keyName: 'key' // IMPORTANT: Preserves backend 'id' field, puts RHF id in 'key'
    });

    const watchedFields = watch("questions"); // Para lógica de dependencias en tiempo real

    // --- MODAL STATE ---
    const [modalOpen, setModalOpen] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [tempQuestion, setTempQuestion] = useState<SurveyQuestion | null>(null);
    const [documentTypes, setDocumentTypes] = useState<DocumentType[]>([]);

    // Cargar tipos de documentos
    useEffect(() => {
        documentTypesService.getAll()
            .then(data => setDocumentTypes(data))
            .catch(err => console.error("Error loading document types", err));
    }, []);

    // Carga Inicial
    useEffect(() => {
        const fetchData = async () => {
            try {
                const config = await SurveyService.getSurveyConfig();
                reset(config);
                setLoading(false);
            } catch (error) {
                console.error("Error loading initial data", error);
                setError("No se pudo cargar la configuración de la encuesta.");
                setLoading(false);
            }
        };
        fetchData();
    }, [reset]);

    const handleOpenModal = (index: number | null) => {
        setEditingIndex(index);

        if (index !== null) {
            // EDIT EXISTING
            const q = fields[index];
            const questionCopy = JSON.parse(JSON.stringify(q)); // Deep copy
            
            // FIX: Si es una pregunta BOOLEANA pero sin opciones, regenerarlas
            if (questionCopy.inputType === 'BOOLEAN' && (!questionCopy.options || questionCopy.options.length === 0)) {
                questionCopy.options = [
                    { id: crypto.randomUUID(), label: 'Sí', value: 'SI', order: 1 },
                    { id: crypto.randomUUID(), label: 'No', value: 'NO', order: 2 }
                ];
            }
            
            setTempQuestion(questionCopy);
        } else {
            // NEW QUESTION
            setTempQuestion({
                id: crypto.randomUUID(), // Temp ID
                statement: '',
                inputType: 'OPEN_TEXT',
                required: false,
                order: fields.length + 1,
                options: [],
                isNew: true,
                requiredDocumentTypeIds: []
            });
        }
        setModalOpen(true);
    };

    const handleRemoveQuestion = async (index: number) => {
        const q = fields[index];

        if (q && !q.isNew) {
            try {
                await SurveyService.deleteQuestion(q.id);
            } catch (err) {
                console.error('Error deleting question on server', err);
                alert('No se pudo eliminar la pregunta en el servidor.');
                return;
            }
        }

        // Remove locally
        remove(index);

        // Persist estructura para sincronizar órdenes/ids
        try {
            const data = getValues();
            await SurveyService.saveSurveyConfig(data, documentTypes);

            // Re-fetch to sync state and avoid duplicates
            const freshConfig = await SurveyService.getSurveyConfig();
            reset(freshConfig);
        } catch (err) {
            console.error('Error guardando encuesta tras eliminar pregunta', err);
            alert('La pregunta fue eliminada localmente, pero ocurrió un error al sincronizar con el servidor.');
        }
    };

    const handleTypeChange = (newType: string) => {
        if (!tempQuestion) return;

        const inputType = newType as SurveyQuestion['inputType'];

        let newOptions = [...(tempQuestion.options || [])];

        if (inputType === 'BOOLEAN') {
            newOptions = [
                { id: crypto.randomUUID(), label: 'Sí', value: 'SI', order: 1 },
                { id: crypto.randomUUID(), label: 'No', value: 'NO', order: 2 }
            ];
        } else if (['OPEN_TEXT', 'NUMBER', 'DATE'].includes(inputType)) {
            newOptions = [];
        }

        setTempQuestion({
            ...tempQuestion,
            inputType,
            options: newOptions
        });
    };

    const saveQuestionFromModal = async () => {
        if (!tempQuestion) return;

        try {
            // VALIDACIÓN: Si requiere documento, validar que IDs existan
            // O si usamos la propiedad directa requiredDocumentTypeIds pero no está ligada a una opción específica (caso legacy)
            // Asumimos lógica: Si hay requiredDocumentTypeIds, es porque alguna opción lo activó.

            // En este editor, hemos simplificado: 
            // - YES_NO: Opción "Sí" activa documento.
            // - SELECT: Cualquier opción podría? Por ahora solo soportamos YES_NO con doc logic en UI.

            const yesOption = tempQuestion.options?.find(o => o.value === 'SI');
            if (yesOption?.requiresDocument) {
                if (!tempQuestion.requiredDocumentTypeIds || tempQuestion.requiredDocumentTypeIds.length === 0) {
                    alert("Has indicado que se requiere documento, pero no has seleccionado ninguno.");
                    return;
                }
            }

            // Guardado Optimista en UI
            if (editingIndex !== null) {
                update(editingIndex, tempQuestion);
            } else {
                append(tempQuestion);
            }

            // Persistir inmediatamente la estructura completa al backend y sincronizar IDs/ordenes
            try {
                const data = getValues();
                await SurveyService.saveSurveyConfig(data, documentTypes);

                // Re-fetch para obtener IDs asignados por backend y evitar duplicados locales
                const freshConfig = await SurveyService.getSurveyConfig();
                reset(freshConfig);
            } catch (err) {
                console.error('Error guardando encuesta tras editar/agregar pregunta', err);
                alert('La pregunta fue actualizada localmente, pero ocurrió un error al guardarla en el servidor.');
            }

            setModalOpen(false);

        } catch (error) {
            console.error(error);
            alert("Error al actualizar la pregunta en memoria");
        }
    };

    

    // --- RENDER HELPERS ---

    if (loading && !fields.length) {
        return <MainLayout><Box sx={{ p: 4 }}>Cargando...</Box></MainLayout>;
    }

    if (error) {
        return (
            <MainLayout>
                <Box sx={{ p: 4 }}><Alert severity="error">{error}</Alert></Box>
            </MainLayout>
        );
    }

    return (
        <MainLayout>
            <Box sx={{ mb: 4, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Box>
                    <Typography variant="h4" fontWeight="bold">Editor de Encuestas</Typography>
                </Box>
            </Box>

            <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between' }}>
                <Typography variant="h6">Preguntas ({fields.length})</Typography>
                <Button variant="outlined" startIcon={<Add />} onClick={() => handleOpenModal(null)}>
                    Agregar Pregunta
                </Button>
            </Box>

            {fields.map((field, index) => (
                <QuestionItem
                    key={field.key}
                    field={field}
                    index={index}
                    onEdit={() => handleOpenModal(index)}
                    onRemove={() => handleRemoveQuestion(index)}
                />
            ))}

            <Dialog open={modalOpen} onClose={() => setModalOpen(false)} maxWidth="md" fullWidth>
                <DialogTitle>
                    {editingIndex !== null ? 'Editar Pregunta' : 'Nueva Pregunta'}
                </DialogTitle>
                <DialogContent dividers>
                    {tempQuestion && (
                        <Grid container spacing={3}>
                            <Grid xs={12} md={8}>
                                <TextField
                                    fullWidth
                                    label="Texto de la Pregunta"
                                    value={tempQuestion.statement}
                                    onChange={(e) => setTempQuestion({ ...tempQuestion, statement: e.target.value })}
                                />
                            </Grid>
                            <Grid xs={12} md={4}>
                                <FormControlLabel
                                    control={
                                        <Switch
                                            checked={tempQuestion.required}
                                            onChange={(e) => setTempQuestion({ ...tempQuestion, required: e.target.checked })}
                                        />
                                    }
                                    label="Respuesta Obligatoria"
                                />
                            </Grid>

                            <Grid xs={12} md={6}>
                                <TextField
                                    select
                                    fullWidth
                                    label="Tipo de Entrada"
                                    value={tempQuestion.inputType}
                                    onChange={(e) => handleTypeChange(e.target.value as SurveyQuestion['inputType'])}
                                >
                                    {QUESTION_TYPES.map((type) => (
                                        <MenuItem key={type.value} value={type.value}>
                                            {type.label}
                                        </MenuItem>
                                    ))}
                                </TextField>
                            </Grid>

                            {/* LOGICA DE DEPENDENCIAS */}
                            <Grid xs={12}>
                                <Paper variant="outlined" sx={{ p: 2, bgcolor: '#f0f7ff' }}>
                                    <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                        Lógica Condicional (Opcional)
                                    </Typography>
                                    <Grid container spacing={2}>
                                        <Grid xs={12}>
                                            <FormControl fullWidth size="small">
                                                <InputLabel>Mostrar si responde...</InputLabel>
                                                <Select
                                                    value={tempQuestion.activationOptionId || ''}
                                                    label="Mostrar si responde..."
                                                    onChange={(e) => setTempQuestion({ ...tempQuestion, activationOptionId: e.target.value || null })}
                                                >
                                                    <MenuItem value=""><em>(Siempre visible)</em></MenuItem>
                                                    {watchedFields
                                                        .map((q, idx) => ({ 
                                                            ...q, 
                                                            originalIndex: idx + 1,
                                                            originalPosition: idx
                                                        }))
                                                        // Filtrar: Solo mostrar si NO es la pregunta actual
                                                        .filter(q => q.originalPosition !== editingIndex)
                                                        // Si estamos editando, solo mostrar anteriores
                                                        .filter(q => {
                                                            if (editingIndex === null) return true; // Nueva pregunta, mostrar todas
                                                            return q.originalPosition < editingIndex; // Solo anteriores
                                                        })
                                                        .flatMap(q => (q.options || []).map(opt => ({
                                                            ...opt,
                                                            questionLabel: `P${q.originalIndex}: ${q.statement.substring(0, 25)}${q.statement.length > 25 ? '...' : ''}`
                                                        })))
                                                        .map(opt => (
                                                            <MenuItem key={opt.id} value={opt.id}>
                                                                {opt.questionLabel} / {opt.label}
                                                            </MenuItem>
                                                        ))
                                                    }
                                                </Select>
                                            </FormControl>
                                        </Grid>
                                    </Grid>
                                </Paper>
                            </Grid>

                            {/* CONFIGURACIÓN DE RESPUESTA (SOLO YES_NO) */}
                            {tempQuestion.inputType === 'BOOLEAN' && (
                                <Grid xs={12}>
                                    <Paper variant="outlined" sx={{ p: 2, bgcolor: '#fffbf0' }}>
                                        <Typography variant="subtitle2" fontWeight="bold" gutterBottom>
                                            Configuración de Respuesta
                                        </Typography>

                                        <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 1 }}>
                                            <FormControlLabel
                                                control={
                                                    <Switch
                                                        checked={tempQuestion.options?.find(o => o.value === 'SI')?.requiresDocument || false}
                                                        onChange={(e) => {
                                                            const newOpts = [...(tempQuestion.options || [])];
                                                            const yesOpt = newOpts.find(o => o.value === 'SI');
                                                            if (yesOpt) {
                                                                yesOpt.requiresDocument = e.target.checked;
                                                                setTempQuestion({ ...tempQuestion, options: newOpts });
                                                            }
                                                        }}
                                                    />
                                                }
                                                label="Pedir documento si responde SÍ"
                                            />

                                            {/* SELECTOR DE DOCUMENTO MULTIPLE */}
                                            {tempQuestion.options?.find(o => o.value === 'SI')?.requiresDocument && (
                                                <FormControl fullWidth size="small" sx={{ ml: 4, mt: 1, width: '90%' }}>
                                                    <InputLabel>Docs Requeridos</InputLabel>
                                                    <Select
                                                        multiple
                                                        value={tempQuestion.requiredDocumentTypeIds || []}
                                                        label="Docs Requeridos"
                                                        onChange={(e) => {
                                                            const val = e.target.value;
                                                            const numVals = typeof val === 'string' ? val.split(',').map(Number) : val as number[];
                                                            setTempQuestion({ ...tempQuestion, requiredDocumentTypeIds: numVals });
                                                        }}
                                                        renderValue={(selected) => (
                                                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                                                {(selected as number[]).map((id) => {
                                                                    const doc = documentTypes.find(d => Number(d.id) === id);
                                                                    return <Chip key={id} label={doc?.name || id} size="small" />;
                                                                })}
                                                            </Box>
                                                        )}
                                                    >
                                                        {documentTypes.map((doc) => (
                                                            <MenuItem key={doc.id} value={Number(doc.id)}>
                                                                {doc.name}
                                                            </MenuItem>
                                                        ))}
                                                    </Select>
                                                </FormControl>
                                            )}
                                        </Box>
                                    </Paper>
                                </Grid>
                            )}
                        </Grid>
                    )}
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
                    <Button variant="contained" onClick={saveQuestionFromModal} disabled={!tempQuestion?.statement}>
                        Guardar / Actualizar Lista
                    </Button>
                </DialogActions>
            </Dialog>
        </MainLayout>
    );
};

