/**
 * MODELOS DE DATOS (TYPESCRIPT INTERFACES)
 * 
 * Aquí definimos la "forma" que tienen los datos en nuestra aplicación.
 * TypeScript usa esto parea evitar errores (ej. intentar acceder a una propiedad que no existe).
 */

// ENUM: Constantes para los estados posibles de un caso
export const CaseStatus = {
  NUEVO: 'NUEVO',
  RECOLECCION: 'RECOLECCION',
  ANALISIS: 'ANALISIS',
  COMITE: 'COMITE',
  FINALIZADO: 'FINALIZADO',
  CANCELADO: 'CANCELADO',
} as const;

// Extracción del tipo a partir del objeto (para usar CaseStatus como type)
export type CaseStatus = (typeof CaseStatus)[keyof typeof CaseStatus];

export interface UserSummary {
  id: string;
  fullName: string;
  email: string;
}

export interface Document {
  id: string;
  name: string;
  path?: string;
  url?: string;
  status: 'PENDING' | 'UPLOADED' | 'APPROVED' | 'REJECTED';
}

export interface Relative {
  id: string;
  firstName: string;
  lastName: string;
  relationship: string;
  age?: number;
  identification?: string;

  phone?: string;
  email?: string;
  address?: string;
  pob?: string;

  isVirtual?: boolean;
}

// 👇 ACTUALIZADA AQUÍ
export interface CaseHistory {
  id: number;
  action: string;
  description: string;
  timestamp: string;
  user?: UserSummary;

  // Nuevos campos sincronizados con el Backend
  type: 'SYSTEM' | 'COMMENT';
  userComment?: string;
}

export type SurveyAnswers = Record<string, string | number | boolean | null>;

export interface Case {
  id: string;
  caseCode: string;
  clientName: string;
  clientIdNumber: string;
  clientPhone?: string;
  clientEmail?: string;

  status: CaseStatus;
  createdAt: string;
  updatedAt?: string;
  deadline?: string; // Fecha límite para completar el caso (ISO 8601)
  clientAddress?: string;
  clientGender?: string;
  clientDob?: string;
  clientPob?: string;
  clientExpeditionPlace?: string;
  clientFatherName?: string;
  clientFatherPhone?: string;
  clientFatherEmail?: string;
  clientFatherId?: string;
  clientFatherAge?: string;

  clientMotherName?: string;
  clientMotherPhone?: string;
  clientMotherEmail?: string;
  clientMotherId?: string;
  clientMotherAge?: string;

  assignedTo?: UserSummary;
  documents?: Document[];
  relatives?: Relative[];
  history?: CaseHistory[];
  surveyAnswers?: SurveyAnswers;
}

export interface CreateCasePayload {
  clientName: string;
  clientIdNumber: string;
  clientPhone: string;
  clientEmail: string;
  caseTypeId?: number;
}