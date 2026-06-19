import { api } from '../api/axios';
import type { SurveyConfig, SurveyQuestion, SurveySection, InputType } from '../types/survey';

// --- MAPPERS & UTILS ---

/**
 * Mapea los tipos crudos del backend a los tipos del frontend.
 */
export const mapBackendTypeToFrontend = (backendType: string): InputType => {
    switch (backendType) {
        case 'SINGLE_CHOICE':
        case 'MULTIPLE_CHOICE':
            return 'OPEN_TEXT';
        case 'NUMBER':
        case 'INTEGER':
            return 'NUMBER';
        case 'YES_NO':
        case 'BOOLEAN':
            return 'BOOLEAN';
        case 'TEXT':
            return 'OPEN_TEXT';
        default:
            return backendType as InputType;
    }
};

/**
 * Mapea del frontend al backend.
 */
export const mapFrontendTypeToBackend = (frontendType: InputType): string => {
    switch (frontendType) {
        case 'OPEN_TEXT': return 'TEXT';
        case 'BOOLEAN': return 'YES_NO';
        default: return frontendType;
    }
};

/**
 * Helper interno para transformar preguntas del backend al formato de la UI
 */
function mapBackendQuestionToFrontend(q: any, sectionId?: string): SurveyQuestion {
    return {
        id: q.id,
        statement: q.statement || q.title || "Pregunta sin título",
        inputType: mapBackendTypeToFrontend(q.inputType || q.type),
        required: !!q.required,
        order: q.order || 0,
        options: (q.options || []).map((opt: any) => ({
            id: opt.id,
            label: opt.label,
            value: opt.value || opt.label,
            order: opt.order,
            requiresDocument: !!opt.requiresDocument
        })),
        sectionId: sectionId,
        activationOptionId: q.activationOptionId || null,
        requiredDocumentTypeIds: Array.isArray(q.requiredDocumentTypeIds)
            ? q.requiredDocumentTypeIds
            : [],
        isNew: false
    };
}

/**
 * Helper interno para transformar preguntas del frontend al formato del backend (Híbrido)
 */
function mapFrontendQuestionToBackend(q: SurveyQuestion, allDocTypes: any[]): any {
    return {
        ...(q.isNew ? {} : { id: q.id }),
        statement: q.statement,
        type: mapFrontendTypeToBackend(q.inputType),
        inputType: mapFrontendTypeToBackend(q.inputType),
        required: q.required,
        order: q.order,
        requiredDocumentTypeIds: (q.requiredDocumentTypeIds || []).map(Number),
        options: (q.options || []).map(opt => {
            let docName = "";
            if (opt.requiresDocument && q.requiredDocumentTypeIds?.length) {
                const doc = allDocTypes.find(d => Number(d.id) === q.requiredDocumentTypeIds![0]);
                docName = doc?.name || "";
            }
            return {
                id: opt.id,
                label: opt.label,
                value: opt.value || opt.label,
                order: opt.order,
                requiresDocument: !!opt.requiresDocument,
                requiredDocumentType: docName
            };
        }),
        activationOptionId: q.activationOptionId,
    };
}

// --- SERVICIO PRINCIPAL ---

export const SurveyService = {
    /**
     * Obtiene la configuración de la encuesta y aplana las secciones.
     */
    getSurveyConfig: async (): Promise<SurveyConfig> => {
        try {
            const { data } = await api.get<SurveySection[]>('/surveys', {
                headers: { 'Cache-Control': 'no-cache', 'Pragma': 'no-cache' },
                params: { _ts: Date.now() }
            });

            if (!data || !Array.isArray(data) || data.length === 0) {
                return { title: "Nueva Encuesta", questions: [], isActive: true, description: "" };
            }

            const rootItem = data[0];
            const allQuestions = data.flatMap((section: any) =>
                (section.questions || []).map((q: any) => mapBackendQuestionToFrontend(q, section.id))
            );

            return {
                id: rootItem.id,
                title: rootItem.title || "Encuesta",
                description: rootItem.description || "",
                questions: allQuestions,
                isActive: true,
                sections: data
            };

        } catch (error) {
            console.error('Error obteniendo la encuesta:', error);
            throw error;
        }
    },

    /**
     * Guarda la configuración enviando una lista plana.
     */
    saveSurveyConfig: async (config: SurveyConfig, documentTypes: any[]): Promise<void> => {
        try {
            if (!config.id) throw new Error("Falta el ID de la encuesta para guardar.");

            const payload = config.questions.map(q => mapFrontendQuestionToBackend(q, documentTypes));

            await api.put(`/surveys/${config.id}/structure`, payload);

        } catch (error) {
            console.error('Error guardando la encuesta:', error);
            throw error;
        }
    },

    deleteQuestion: async (questionId: string): Promise<void> => {
        await api.delete(`/surveys/questions/${questionId}`);
    },

    /**
     * Guardado individual (PATCH) usando el mapper híbrido.
     */
    saveQuestionConfig: async (questionId: string, partialConfig: Partial<SurveyQuestion>, documentTypes: any[]): Promise<void> => {
        const payload = mapFrontendQuestionToBackend(partialConfig as SurveyQuestion, documentTypes);
        await api.patch(`/surveys/questions/${questionId}`, payload);
    }
};

