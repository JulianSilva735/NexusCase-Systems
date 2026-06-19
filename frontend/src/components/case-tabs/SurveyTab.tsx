import { useEffect, useState, useMemo } from 'react';
import { useForm, Controller, useWatch } from 'react-hook-form';
import {
    Box, Typography, Button, TextField, Paper,
    CircularProgress, Alert, Snackbar, Stack
} from '@mui/material';
import { Save as SaveIcon } from '@mui/icons-material';

import { documentTypesService } from '../../services/documentTypes.service';
import { api } from '../../api/axios';
import { SurveyService } from '../../services/survey.service';

export type SurveyAnswerValue = string | number | boolean;
export type SurveyAnswersFixed = Record<string, SurveyAnswerValue>;

import type { SurveyConfig } from '../../types/survey';

interface Props {
    caseId: string;
    initialData?: any;
    onUpdate?: () => void | Promise<void>;
}

type OptionMap = Record<string, { questionId: string; value: any }>;

// -----------------------------------------------------
// QUESTION RENDERER
// -----------------------------------------------------
const QuestionRenderer = ({ question, control }: any) => {

    const value = useWatch({
        control,
        name: String(question.id)
    });

    return (
        <Box>
            <Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 'bold' }}>
                {question.statement}
                {question.required && <span style={{ color: 'red' }}> *</span>}
            </Typography>

            <Controller
                name={String(question.id)}
                control={control}
                rules={{
                    required: question.required ? 'Campo obligatorio' : false
                }}
                render={({ field, fieldState }) => (

                    <Box sx={{ my: 1 }}>
                        {question.inputType === 'BOOLEAN' ? (
                            <Stack direction="row" spacing={2}>

                                <Button
                                    variant={value === true ? "contained" : "outlined"}
                                    color="success"
                                    onClick={() => field.onChange(true)}
                                >
                                    Sí
                                </Button>

                                <Button
                                    variant={value === false ? "contained" : "outlined"}
                                    color="error"
                                    onClick={() => field.onChange(false)}
                                >
                                    No
                                </Button>

                            </Stack>
                        ) : (
                            <TextField
                                {...field}
                                value={field.value ?? ''}
                                fullWidth
                                size="small"
                                type={question.inputType === 'NUMBER' ? 'number' : 'text'}
                                error={!!fieldState.error}
                                helperText={fieldState.error?.message}
                            />
                        )}
                    </Box>
                )}
            />
        </Box>
    );
};


export const SurveyTab = ({ caseId, initialData, onUpdate }: Props) => {
    const [config, setConfig] = useState<SurveyConfig | null>(null);
    const [documentTypes, setDocumentTypes] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0); // WIZARD: índice de pregunta actual
    const [feedback, setFeedback] = useState({
        open: false,
        message: '',
        type: 'success' as 'success' | 'error'
    });

    const { control, handleSubmit, reset } = useForm<SurveyAnswersFixed>({
        defaultValues: {}
    });

    // Observar TODOS los cambios en el formulario para actualizar la lista del wizard
    const formValues = useWatch({ control });

    // ---------- LOAD CONFIG ----------
    useEffect(() => {
        Promise.all([
            SurveyService.getSurveyConfig(),
            documentTypesService.getAll()
        ])
            .then(([surveyData, docTypes]) => {

                // Guardamos los tipos de documentos
                setDocumentTypes(docTypes);

                // 🔒 FORZAMOS IDS STRING SIEMPRE
                surveyData.questions = surveyData.questions.map(q => ({
                    ...q,
                    id: String(q.id)
                }));

                setConfig(surveyData);

                const defaults: SurveyAnswersFixed = {};

                if (Array.isArray(initialData)) {
                    initialData.forEach((r: any) => {
                        if (r?.questionId) {
                            defaults[String(r.questionId)] = r.value;
                        }
                    });
                }

                surveyData.questions = surveyData.questions
                    .filter(q => q?.id !== undefined && q?.id !== null && q?.id !== "")
                    .map(q => ({
                        ...q,
                        id: String(q.id)
                    }));

                reset(defaults);
            })
            .catch(err => console.error("Error loading survey config", err))
            .finally(() => setLoading(false));
    }, [initialData, reset]);

    // ---------- OPTION MAP ----------
    const optionMap = useMemo(() => {
        const map: OptionMap = {};
        if (!config) return map;

        config.questions.forEach(q => {
            q.options?.forEach(opt => {
                let val: any = opt.value;

                if (q.inputType === 'BOOLEAN') {
                    const s = String(opt.value).toUpperCase();
                    val = ['SI', 'S', 'YES', '1', 'TRUE'].includes(s);
                }

                map[opt.id] = {
                    questionId: String(q.id),
                    value: val
                };
            });
        });


        return map;
    }, [config]);

    // --- ORGANIZAR PREGUNTAS EN JERARQUÍA ---
    const getQuestionHierarchy = () => {
        if (!config) return [];
        
        // Todas las preguntas válidas
        const allQuestions = config.questions
            .filter(q => q?.id !== undefined && q?.id !== null && q?.id !== "")
            .sort((a, b) => a.order - b.order);
        
        // Preguntas "padre": no tienen activationOptionId
        const parentQuestions = allQuestions.filter(q => !q.activationOptionId);

        // Organizar en jerarquía
        const hierarchy = parentQuestions.map(parent => {
            // Preguntas "hijas": tienen activationOptionId que apunta a una opción de este padre
            const childQuestions = allQuestions
                .filter(q => {
                    if (!q.activationOptionId) return false;
                    
                    // Verificar si el activationOptionId pertenece a una opción del padre
                    const hasOption = parent.options?.some(opt => opt.id === q.activationOptionId) || false;
                    return hasOption;
                })
                .sort((a, b) => a.order - b.order);

            return {
                parent,
                children: childQuestions
            };
        });

        return hierarchy;
    };

    // Calcular lista del wizard con valores actuales (DESPUÉS de optionMap)
    const wizardList = useMemo(() => {
        if (!config) return [];

        const hierarchy = getQuestionHierarchy();
        const flatList: typeof config.questions = [];

        hierarchy.forEach(({ parent, children }) => {
            // Siempre agregar la pregunta padre
            flatList.push(parent);

            // Para las hijas, verificar si el padre tiene la respuesta correcta
            children.forEach(child => {
                if (!child.activationOptionId) {
                    flatList.push(child);
                    return;
                }

                // Buscar el activationData
                const activationData = optionMap[child.activationOptionId];
                if (!activationData) {
                    flatList.push(child);
                    return;
                }

                // Obtener el valor actual del padre (usando formValues observado)
                const parentValue = formValues[activationData.questionId];
                
                // Solo agregar si el valor coincide
                if (String(parentValue) === String(activationData.value)) {
                    flatList.push(child);
                }
            });
        });

        return flatList;
    }, [config, formValues, optionMap]);

    // Efecto: Si la lista se vuelve más corta y el índice actual es inválido, volver atrás
    useEffect(() => {
        if (currentQuestionIndex >= wizardList.length) {
            setCurrentQuestionIndex(Math.max(0, wizardList.length - 1));
        }
    }, [wizardList.length, currentQuestionIndex]);



    // ---------- CREATE REQUIRED DOCUMENTS ----------
    const createRequiredDocuments = async () => {
        if (!config) return;

        // Recopilar todos los IDs de documentos requeridos
        const requiredDocTypeIds = new Set<number>();
        config.questions.forEach(q => {
            if (q.requiredDocumentTypeIds && q.requiredDocumentTypeIds.length > 0) {
                q.requiredDocumentTypeIds.forEach(id => requiredDocTypeIds.add(id));
            }
        });

        // Para cada tipo de documento, intentar crearlo en el backend
        for (const docTypeId of requiredDocTypeIds) {
            try {
                const docType = documentTypes.find(dt => Number(dt.id) === docTypeId);
                if (!docType) {
                    console.warn(`Tipo de documento ${docTypeId} no encontrado en la lista`);
                    continue;
                }

                // Crear documento en estado PENDING (sin archivo)
                await api.post(`/documents`, {
                    caseId: caseId,
                    documentTypeId: docTypeId,
                    name: docType.name,
                    status: 'PENDING',
                    required: true
                });

            } catch (error: any) {
                // Si el documento ya existe, el backend debería devolver un error 409 o similar
                // Lo ignoramos para no interrumpir el flujo
                if (error.response?.status !== 409 && error.response?.status !== 400) {
                    console.error(`Error creando documento tipo ${docTypeId}:`, error);
                }
            }
        }
    };

    // ---------- SUBMIT ----------
    const onSubmit = async (data: SurveyAnswersFixed) => {
        setSaving(true);

        try {
            const formattedResponses = Object.entries(data)
                .filter(([id]) => /^\d+$/.test(id) || id.match(/^[0-9a-f-]{36}$/i))
                .map(([id, rawValue]) => {

                    const getDeepValue = (val: any): any => {
                        if (val !== null && typeof val === 'object') {
                            if ('value' in val) return getDeepValue(val.value);
                            if ('id' in val && Object.keys(val).length === 1) return val.id;
                        }
                        return val;
                    };

                    const question = config?.questions.find(q => String(q.id) === String(id));
                    const val = getDeepValue(rawValue);
                    let finalValue: any = val;

                    if (val === 'true' || val === true)
                        finalValue = true;
                    else if (val === 'false' || val === false)
                        finalValue = false;
                    else if (question?.inputType === 'NUMBER')
                        finalValue = Number(val);
                    else
                        finalValue = val ?? "";

                    return {
                        questionId: String(id),
                        value: finalValue,
                        question: question // Mantener referencia para filtrar después
                    };
                })
                // Filtrar respuestas vacías o null (especialmente de preguntas ocultas)
                .filter(response => {
                    // No enviar valores null o undefined para preguntas booleanas
                    if (response.question?.inputType === 'BOOLEAN' && 
                        (response.value === null || response.value === undefined)) {
                        return false;
                    }
                    // No enviar strings vacías para preguntas de texto
                    if (response.question?.inputType === 'OPEN_TEXT' && 
                        response.value === '') {
                        return false;
                    }
                    return true;
                })
                // Remover la referencia a la pregunta antes de enviar
                .map(({ questionId, value }) => ({ questionId, value }));
            
            await api.post(`/surveys/responses/${caseId}`, { responses: formattedResponses });

            // 📄 CREAR DOCUMENTOS REQUERIDOS AUTOMÁTICAMENTE
            await createRequiredDocuments();

            setFeedback({
                open: true,
                message: 'Respuestas guardadas y documentos requeridos creados',
                type: 'success'
            });

            await onUpdate?.();

        } catch (err) {
            console.error(err);
            setFeedback({
                open: true,
                message: 'Error al guardar',
                type: 'error'
            });
        } finally {
            setSaving(false);
        }
    };

    if (loading)
        return <CircularProgress sx={{ display: 'block', mx: 'auto', mt: 4 }} />;

    if (!config)
        return <Alert severity="error">Error cargando encuesta</Alert>;

    return (
        <Box component="form" onSubmit={handleSubmit(onSubmit)} sx={{ maxWidth: 800, mx: 'auto', p: 2 }}>

            {/* HEADER */}
            <Box sx={{ mb: 4 }}>
                <Typography variant="h5" fontWeight="bold">
                    {config.title || 'Ficha del Caso'}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    {config.description}
                </Typography>
            </Box>

            {/* QUESTIONS - WIZARD MODE */}
            <Paper variant="outlined" sx={{ p: 4, display: 'flex', flexDirection: 'column', gap: 3 }}>
                {(() => {
                    const currentQ = wizardList[currentQuestionIndex];
                    const total = wizardList.length;
                    const isLastQuestion = currentQuestionIndex === wizardList.length - 1;

                    return (
                        <>
                            {/* PROGRESS */}
                            <Box sx={{ textAlign: 'center', mb: 2 }}>
                                <Typography variant="body2" color="text.secondary">
                                    Pregunta {currentQuestionIndex + 1} de {total}
                                </Typography>
                                <Box sx={{ width: '100%', height: 6, bgcolor: '#e0e0e0', borderRadius: 1, mt: 1, overflow: 'hidden' }}>
                                    <Box 
                                        sx={{ 
                                            height: '100%', 
                                            bgcolor: '#2196f3', 
                                            width: `${((currentQuestionIndex + 1) / total) * 100}%`,
                                            transition: 'width 0.3s ease'
                                        }} 
                                    />
                                </Box>
                            </Box>

                            {/* CURRENT QUESTION */}
                            {currentQ ? (
                                <QuestionRenderer
                                key={currentQ.id}
                                    question={currentQ}
                                    control={control}
                                />
                            ) : (
                                <Alert severity="warning">No hay pregunta para mostrar</Alert>
                            )}

                            {/* NAVIGATION */}
                            <Box sx={{ display: 'flex', gap: 2, justifyContent: 'space-between', mt: 4 }}>
                                <Button
                                    variant="outlined"
                                    disabled={currentQuestionIndex === 0}
                                    onClick={() => {
                                        console.log('⬅️ Anterior: de', currentQuestionIndex, 'a', Math.max(0, currentQuestionIndex - 1));
                                        setCurrentQuestionIndex(Math.max(0, currentQuestionIndex - 1));
                                    }}
                                >
                                    ← Anterior
                                </Button>

                                {isLastQuestion ? (
                                    <Button
                                        variant="contained"
                                        color="success"
                                        disabled={saving}
                                        startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                                        onClick={handleSubmit(onSubmit)}
                                    >
                                        {saving ? 'Guardando...' : 'Guardar Respuestas'}
                                    </Button>
                                ) : (
                                    <Button
                                        variant="contained"
                                        onClick={() => {
                                            console.log('➡️ Siguiente: de', currentQuestionIndex, 'a', Math.min(total - 1, currentQuestionIndex + 1));
                                            setCurrentQuestionIndex(Math.min(total - 1, currentQuestionIndex + 1));
                                        }}
                                    >
                                        Siguiente →
                                    </Button>
                                )}
                            </Box>
                        </>
                    );
                })()}
            </Paper>

            <Snackbar
                open={feedback.open}
                autoHideDuration={4000}
                onClose={() => setFeedback(v => ({ ...v, open: false }))}
            >
                <Alert severity={feedback.type}>{feedback.message}</Alert>
            </Snackbar>
        </Box>
    );
};

