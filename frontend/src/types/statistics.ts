export type EstadoCasoEstadistica = 'PROCESO' | 'CANCELADO' | 'TERMINADO';

export type DocumentoEstado = 'PENDING' | 'UPLOADED' | 'APPROVED' | 'REJECTED';

export interface RequestedDocument {
  name: string;
  status: DocumentoEstado;
}

export interface CasoEstadistica {
  id: string;
  clientName: string;
  assignedUserName: string | null;
  status: EstadoCasoEstadistica;
  completionPercentage: number;
  productivityScore: number;
  requestedDocuments: RequestedDocument[];
  createdAt: string; // Para cálculos de tiempo
  deadline?: string; // Fecha límite del caso
}
