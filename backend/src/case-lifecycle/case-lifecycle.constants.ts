export enum LifecycleStageKey {
  PENDIENTE = 'PENDIENTE',
  UBICADO = 'UBICADO',
  CONTACTADO = 'CONTACTADO',
  CONTRATO_ENVIADO = 'CONTRATO_ENVIADO',
  CONTRATO_FIRMADO = 'CONTRATO_FIRMADO',
  DOCUMENTOS_LISTOS = 'DOCUMENTOS_LISTOS',
  RADICADO_ENTIDAD = 'RADICADO_ENTIDAD',
  ACTUALIZACION_CASO = 'ACTUALIZACION_CASO',
  PAGADO = 'PAGADO',
  FINALIZADO = 'FINALIZADO',
  CANCELADO = 'CANCELADO',
}

export enum LifecycleSource {
  AUTO = 'AUTO',
  MANUAL = 'MANUAL',
}

export interface WorkflowActivityDefinition {
  key: string;
  label: string;
  weight: number;
  indicatorKey?: string;
}

export interface WorkflowStageSeed {
  key: LifecycleStageKey;
  label: string;
  order: number;
  isTerminal: boolean;
  activities: WorkflowActivityDefinition[];
}

export const LIFECYCLE_STAGE_SEQUENCE: LifecycleStageKey[] = [
  LifecycleStageKey.PENDIENTE,
  LifecycleStageKey.UBICADO,
  LifecycleStageKey.CONTACTADO,
  LifecycleStageKey.CONTRATO_ENVIADO,
  LifecycleStageKey.CONTRATO_FIRMADO,
  LifecycleStageKey.DOCUMENTOS_LISTOS,
  LifecycleStageKey.RADICADO_ENTIDAD,
  LifecycleStageKey.ACTUALIZACION_CASO,
  LifecycleStageKey.PAGADO,
  LifecycleStageKey.FINALIZADO,
  LifecycleStageKey.CANCELADO,
];

export const VALID_AUTOMATIC_FORWARD_TRANSITIONS: Record<string, string[]> = {
  [LifecycleStageKey.PENDIENTE]: [LifecycleStageKey.UBICADO],
  [LifecycleStageKey.UBICADO]: [LifecycleStageKey.CONTACTADO],
  [LifecycleStageKey.CONTACTADO]: [LifecycleStageKey.CONTRATO_ENVIADO],
  [LifecycleStageKey.CONTRATO_ENVIADO]: [LifecycleStageKey.CONTRATO_FIRMADO],
  [LifecycleStageKey.CONTRATO_FIRMADO]: [LifecycleStageKey.DOCUMENTOS_LISTOS],
  [LifecycleStageKey.DOCUMENTOS_LISTOS]: [LifecycleStageKey.RADICADO_ENTIDAD],
  [LifecycleStageKey.RADICADO_ENTIDAD]: [LifecycleStageKey.ACTUALIZACION_CASO],
  [LifecycleStageKey.ACTUALIZACION_CASO]: [LifecycleStageKey.PAGADO],
  [LifecycleStageKey.PAGADO]: [LifecycleStageKey.FINALIZADO],
};

export const LIFECYCLE_FLAG_KEYS = [
  'clientLocated',
  'firstContactDone',
  'contractSent',
  'contractSigned',
  'entityFiled',
  'caseUpdated',
  'paymentConfirmed',
] as const;

export type LifecycleFlagKey = (typeof LIFECYCLE_FLAG_KEYS)[number];

export const DEFAULT_WORKFLOW_STAGE_CONFIG: WorkflowStageSeed[] = [
  {
    key: LifecycleStageKey.PENDIENTE,
    label: 'Pendiente',
    order: 1,
    isTerminal: false,
    activities: [
      { key: 'case_created', label: 'Caso creado', weight: 100, indicatorKey: 'case_created' },
    ],
  },
  {
    key: LifecycleStageKey.UBICADO,
    label: 'Ubicado',
    order: 2,
    isTerminal: false,
    activities: [
      { key: 'client_located', label: 'Cliente ubicado', weight: 100, indicatorKey: 'client_located' },
    ],
  },
  {
    key: LifecycleStageKey.CONTACTADO,
    label: 'Contactado',
    order: 3,
    isTerminal: false,
    activities: [
      { key: 'first_contact_done', label: 'Primer contacto realizado', weight: 100, indicatorKey: 'first_contact_done' },
    ],
  },
  {
    key: LifecycleStageKey.CONTRATO_ENVIADO,
    label: 'Contrato enviado',
    order: 4,
    isTerminal: false,
    activities: [
      { key: 'contract_sent', label: 'Contrato enviado', weight: 100, indicatorKey: 'contract_sent' },
    ],
  },
  {
    key: LifecycleStageKey.CONTRATO_FIRMADO,
    label: 'Contrato firmado',
    order: 5,
    isTerminal: false,
    activities: [
      { key: 'contract_signed', label: 'Contrato firmado', weight: 100, indicatorKey: 'contract_signed' },
    ],
  },
  {
    key: LifecycleStageKey.DOCUMENTOS_LISTOS,
    label: 'Documentos listos',
    order: 6,
    isTerminal: false,
    activities: [
      { key: 'documents_ready', label: 'Documentos obligatorios listos', weight: 100, indicatorKey: 'documents_ready' },
    ],
  },
  {
    key: LifecycleStageKey.RADICADO_ENTIDAD,
    label: 'Radicado entidad',
    order: 7,
    isTerminal: false,
    activities: [
      { key: 'entity_filed', label: 'Radicado en entidad', weight: 100, indicatorKey: 'entity_filed' },
    ],
  },
  {
    key: LifecycleStageKey.ACTUALIZACION_CASO,
    label: 'Actualizacion caso',
    order: 8,
    isTerminal: false,
    activities: [
      { key: 'case_updated', label: 'Actualizacion de caso registrada', weight: 100, indicatorKey: 'case_updated' },
    ],
  },
  {
    key: LifecycleStageKey.PAGADO,
    label: 'Pagado',
    order: 9,
    isTerminal: false,
    activities: [
      { key: 'payment_confirmed', label: 'Pago confirmado', weight: 100, indicatorKey: 'payment_confirmed' },
    ],
  },
  {
    key: LifecycleStageKey.FINALIZADO,
    label: 'Finalizado',
    order: 10,
    isTerminal: true,
    activities: [],
  },
  {
    key: LifecycleStageKey.CANCELADO,
    label: 'Cancelado',
    order: 11,
    isTerminal: true,
    activities: [],
  },
];
