/**
 * UTILIDADES PARA CALCULAR MÉTRICAS DE CASOS
 * 
 * Este archivo contiene funciones para calcular automáticamente:
 * - Cumplimiento: % de avance del caso
 * - Productividad: Eficiencia vs tiempo asignado
 */

/**
 * Calcula el porcentaje de cumplimiento de un caso
 * Combina 3 factores:
 * - Tareas del checklist completadas (40%)
 * - Documentos subidos (30%)
 * - Avance según tiempo (30%)
 */
export function calculateCompletion(params: {
  checklist: Record<string, boolean>;
  totalChecklistItems: number;
  documentsUploaded: number;
  totalDocuments: number;
  createdAt: string;
  deadline?: string;
}): number {
  const { 
    checklist, 
    totalChecklistItems, 
    documentsUploaded, 
    totalDocuments,
    createdAt,
    deadline
  } = params;

  // Factor 1: Checklist (40%)
  const completedTasks = Object.values(checklist).filter(Boolean).length;
  const checklistScore = totalChecklistItems > 0 
    ? (completedTasks / totalChecklistItems) * 40
    : 0;

  // Factor 2: Documentos (30%)
  const docScore = totalDocuments > 0
    ? (documentsUploaded / totalDocuments) * 30
    : 0;

  // Factor 3: Tiempo transcurrido (30%)
  let timeScore = 0;
  if (deadline) {
    const created = new Date(createdAt);
    const dead = new Date(deadline);
    const now = new Date();
    
    const totalTime = dead.getTime() - created.getTime();
    const elapsed = now.getTime() - created.getTime();
    
    if (totalTime > 0) {
      // Entre más tiempo ha pasado, mayor debería ser el avance esperado
      const timeProgress = Math.min((elapsed / totalTime) * 100, 100);
      // Ajustamos a escala de 30%
      timeScore = (timeProgress / 100) * 30;
    }
  }

  // Total: suma de los 3 factores
  const total = Math.round(checklistScore + docScore + timeScore);
  return Math.min(total, 100); // Máximo 100%
}

/**
 * Calcula el porcentaje de productividad de un caso
 * Combina 3 factores:
 * - Avance real vs esperado según tiempo (50%)
 * - Velocidad de procesamiento de documentos (25%)
 * - Eficiencia (menos tiempo = mejor) (25%)
 */
export function calculateProductivity(params: {
  completionPercentage: number; // El % de cumplimiento calculado
  createdAt: string;
  deadline?: string;
  documentsUploaded: number;
  totalDocuments: number;
}): number {
  const { 
    completionPercentage,
    createdAt,
    deadline,
    documentsUploaded,
    totalDocuments
  } = params;

  if (!deadline) {
    // Sin deadline, solo consideramos el avance de documentos
    return totalDocuments > 0
      ? Math.round((documentsUploaded / totalDocuments) * 100)
      : 0;
  }

  const created = new Date(createdAt);
  const dead = new Date(deadline);
  const now = new Date();

  const totalTime = dead.getTime() - created.getTime();
  const elapsed = now.getTime() - created.getTime();

  if (totalTime <= 0) return 0;

  // Factor 1: Avance real vs esperado (50%)
  const expectedProgress = Math.min((elapsed / totalTime) * 100, 100);
  let progressScore = 0;
  
  if (expectedProgress > 0) {
    // Si el avance real es mayor al esperado, la productividad es mayor
    const ratio = completionPercentage / expectedProgress;
    progressScore = Math.min(ratio * 50, 75); // Máximo 75% por este factor
  }

  // Factor 2: Velocidad de documentos (25%)
  const docVelocity = totalDocuments > 0
    ? (documentsUploaded / totalDocuments) * 25
    : 0;

  // Factor 3: Eficiencia de tiempo (25%)
  let efficiencyScore = 0;
  const timeUsedPercentage = (elapsed / totalTime) * 100;
  
  if (completionPercentage >= 100) {
    // Caso completado: mientras menos tiempo usó, mejor
    efficiencyScore = Math.max(25 - (timeUsedPercentage / 100) * 10, 0);
  } else if (completionPercentage > timeUsedPercentage) {
    // Va adelantado
    efficiencyScore = 25;
  } else {
    // Va atrasado
    const delay = timeUsedPercentage - completionPercentage;
    efficiencyScore = Math.max(25 - (delay / 10), 0);
  }

  const total = Math.round(progressScore + docVelocity + efficiencyScore);
  return Math.min(Math.max(total, 0), 100); // Entre 0 y 100%
}

/**
 * Obtiene el total de elementos del checklist
 * Basado en la configuración de STAGES_CONFIG
 */
export function getTotalChecklistItems(): number {
  // Esta configuración debe coincidir con STAGES_CONFIG de CaseStatistics.tsx
  const activities = [
    'cliente_creado', 'busqueda_familiares',
    'sube_ubica', 'asignacion_asesor',
    'carta_presentacion', 'contacto_efectivo',
    'descargar_enviar',
    'recibir_firmado', 'subir_software_contrato',
    'docs_subido_software',
    'conformacion', 'pedir_cita', 'asistir_cita', 'radicar'
  ];
  return activities.length;
}

/**
 * Calcula el porcentaje de documentos aprobados/cargados
 * Fórmula: (#Documentos Listos / #Total de Documentos) × 100 = %
 */
export function calculateDocumentPercentage(requestedDocuments: any[]): number {
  if (!requestedDocuments || requestedDocuments.length === 0) {
    return 0;
  }

  // Contar documentos "listos" (APPROVED o UPLOADED)
  const readyCount = requestedDocuments.filter(
    (doc) => doc.status === 'APPROVED' || doc.status === 'UPLOADED'
  ).length;

  const totalDocuments = requestedDocuments.length;

  // Aplicar la fórmula: (listos / total) × 100
  const percentage = (readyCount / totalDocuments) * 100;

  return Math.round(percentage);
}

/**
 * Calcula las métricas completas del caso
 */
export function calculateCaseMetrics(caseData: {
  checklist: Record<string, boolean>;
  documentsUploaded: number;
  totalDocuments: number;
  createdAt: string;
  deadline?: string;
}): {
  completion: number;
  productivity: number;
} {
  try {
    // Validar datos básicos
    if (!caseData.createdAt) {
      return { completion: 0, productivity: 0 };
    }

    const totalChecklistItems = getTotalChecklistItems();
    
    const completion = calculateCompletion({
      ...caseData,
      totalChecklistItems
    });

    // Si no hay deadline, la productividad se basa solo en documentos
    const productivity = !caseData.deadline 
      ? (caseData.documentsUploaded / Math.max(caseData.totalDocuments, 1)) * 100
      : calculateProductivity({
          completionPercentage: completion,
          createdAt: caseData.createdAt,
          deadline: caseData.deadline,
          documentsUploaded: caseData.documentsUploaded,
          totalDocuments: caseData.totalDocuments
        });

    // Asegurar que no devolvamos NaN
    return {
      completion: isNaN(completion) ? 0 : Math.min(Math.max(completion, 0), 100),
      productivity: isNaN(productivity) ? 0 : Math.min(Math.max(productivity, 0), 100)
    };
  } catch (error) {
    console.warn('Error calculando métricas:', error);
    return { completion: 0, productivity: 0 };
  }
}
