import { CaseStatus } from '../entities/case.entity';

export enum CaseStatsStatus {
  PROCESO = 'PROCESO',
  CANCELADO = 'CANCELADO',
  TERMINADO = 'TERMINADO',
}

export class RequestedDocumentDto {
  name: string;
  status: 'PENDIENTE' | 'CARGADO' | 'APROBADO' | 'RECHAZADO';
}

export class CaseStatsResponseDto {
  id: string;
  clientName: string;
  assignedUserName: string | null;
  status: CaseStatsStatus;
  completionPercentage: number;
  productivityScore: number;
  requestedDocuments: RequestedDocumentDto[];
  deadline: Date | null;
  // Campos de resumen de documentación
  totalDocumentsRequired: number;
  documentsUploaded: number;
  documentsPending: number;
}

/**
 * Helper function to map CaseStatus to CaseStatsStatus
 */
export function mapCaseStatusToStatsStatus(status: CaseStatus): CaseStatsStatus {
  switch (status) {
    case CaseStatus.FINALIZADO:
      return CaseStatsStatus.TERMINADO;
    case CaseStatus.CANCELADO:
      return CaseStatsStatus.CANCELADO;
    default:
      return CaseStatsStatus.PROCESO;
  }
}
