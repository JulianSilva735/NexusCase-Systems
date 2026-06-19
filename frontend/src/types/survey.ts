export const QUESTION_TYPES = [
    { value: 'OPEN_TEXT', label: 'Texto Abierto' },
    { value: 'NUMBER', label: 'Numérico' },
    { value: 'BOOLEAN', label: 'Booleano (Sí / No)' }
] as const;

export type InputType = typeof QUESTION_TYPES[number]['value'];

export interface SurveyOption {
    id: string; // Puede ser UUID o string del backend
    label: string;
    value: string;
    order: number;
    requiresDocument?: boolean;
}

export interface SurveyQuestion {
    id: string;
    statement: string;
    inputType: InputType;
    required: boolean;
    order: number;
    options?: SurveyOption[];
    activationOptionId?: string | null; // ID de la opción que activa esta pregunta

    // Estructura de Secciones
    sectionId?: string;

    // Documentos
    requiredDocumentTypeIds?: number[]; // ARRAY DE ESTRICTO NUMBER

    // Propiedades Legacy o de Backend (Mantenidas para mapeo pero tipadas)
    type?: string;

    // UI State
    isNew?: boolean;
}

export interface SurveySection {
    id?: string;
    title: string;
    description?: string;
    questions?: SurveyQuestion[];
}

export interface SurveyConfig {
    id?: string;
    title: string;
    description?: string;
    questions: SurveyQuestion[]; // Lista plana para el frontend, o estructurada si cambiamos lógica
    isActive?: boolean;
    sections?: SurveySection[]; // Para mantener la estructura original si existe
}
