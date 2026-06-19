export type LifecycleSource = 'AUTO' | 'MANUAL';

export type LifecycleStageStatus = 'completed' | 'current' | 'pending';

export interface WorkflowActivity {
  key: string;
  label: string;
  weight: number;
  indicatorKey?: string;
}

export interface WorkflowStage {
  key: string;
  label: string;
  order: number;
  activities: WorkflowActivity[];
  is_terminal: boolean;
}

export interface LifecycleManualOverride {
  active: boolean;
  target_stage?: string;
  reason?: string;
  user_id?: string;
  changed_at?: string;
}

export interface LifecycleStageSnapshot {
  key: string;
  label: string;
  progress: number;
  completed_activities: number;
  total_activities: number;
  status: LifecycleStageStatus;
}

export interface CaseLifecycleSnapshot {
  current_stage: string;
  current_stage_label: string;
  source: LifecycleSource;
  manual_override: LifecycleManualOverride;
  stages: LifecycleStageSnapshot[];
}

export interface ManualLifecycleOverridePayload {
  target_stage: string;
  reason?: string;
  force_invalid_transition?: boolean;
}

export interface LifecycleHistoryItem {
  id?: string;
  from_stage?: string | null;
  to_stage: string;
  source: LifecycleSource;
  reason?: string;
  user_id?: string;
  changed_at: string;
}
