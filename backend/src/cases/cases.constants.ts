import { CaseStatus } from './entities/case.entity';

export interface StageActivityConfig {
    key: string;
    weight: number;
}

export const STAGES_CONFIG: Record<string, StageActivityConfig[]> = {
    [CaseStatus.NUEVO]: [
        { key: 'cliente_creado', weight: 30 },
        { key: 'busqueda_familiares', weight: 70 },
    ],
    [CaseStatus.RECOLECCION]: [
        { key: 'docs_subido_software', weight: 100 }
    ],
    [CaseStatus.ANALISIS]: [
        { key: 'conformacion', weight: 30 },
        { key: 'pedir_cita', weight: 10 },
        { key: 'asistir_cita', weight: 10 },
        { key: 'radicar', weight: 50 },
    ],
    [CaseStatus.COMITE]: [],
    [CaseStatus.FINALIZADO]: [],
    [CaseStatus.CANCELADO]: []
};

export const INITIAL_STATES = [
    { id: 'NUEVO', label: 'Pendientes', order: 1, maxDays: 2, desc: 'Creación de cliente y búsqueda.' },
    { id: 'RECOLECCION', label: 'Documentos', order: 2, maxDays: 5, desc: 'Recolección y carga de requisitos.' },
    { id: 'ANALISIS', label: 'Radicado Entidad', order: 3, maxDays: 3, desc: 'Análisis interno y radicación.' },
    { id: 'COMITE', label: 'Comité', order: 4, maxDays: 2, desc: 'Aprobación final del caso.' },
    { id: 'FINALIZADO', label: 'Finalizado', order: 5, maxDays: 0, desc: 'Caso cerrado exitosamente.' },
    { id: 'CANCELADO', label: 'Cancelado', order: 6, maxDays: 0, desc: 'Caso anulado o desistido.' },
];
