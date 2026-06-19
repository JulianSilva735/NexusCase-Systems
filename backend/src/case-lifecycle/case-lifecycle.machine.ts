import { WorkflowActivityDefinition } from './case-lifecycle.constants';

export interface StageRule {
  key: string;
  label: string;
  order: number;
  isTerminal: boolean;
  activities: WorkflowActivityDefinition[];
}

export interface StageComputedProgress {
  key: string;
  label: string;
  progress: number;
  completedActivities: number;
  totalActivities: number;
}

export interface LifecycleMachineInput {
  stages: StageRule[];
  activityCompletion: Map<string, boolean>;
  indicators: Record<string, boolean>;
}

export interface LifecycleMachineResult {
  stageProgress: StageComputedProgress[];
  autoCurrentStageKey: string;
  autoCurrentStageLabel: string;
}

export class CaseLifecycleMachine {
  compute(input: LifecycleMachineInput): LifecycleMachineResult {
    const orderedStages = [...input.stages].sort((a, b) => a.order - b.order);
    const stageProgress = orderedStages.map((stage) => this.computeStageProgress(stage, input));

    const firstIncomplete = stageProgress.find((stage) => stage.progress < 100);
    const fallback = stageProgress[stageProgress.length - 1];
    const selected = firstIncomplete ?? fallback;

    return {
      stageProgress,
      autoCurrentStageKey: selected.key,
      autoCurrentStageLabel: selected.label,
    };
  }

  private computeStageProgress(stage: StageRule, input: LifecycleMachineInput): StageComputedProgress {
    if (!stage.activities.length) {
      return {
        key: stage.key,
        label: stage.label,
        progress: stage.isTerminal ? 0 : 100,
        completedActivities: 0,
        totalActivities: 0,
      };
    }

    const totalWeight = stage.activities.reduce((sum, activity) => sum + activity.weight, 0);

    if (totalWeight <= 0) {
      return {
        key: stage.key,
        label: stage.label,
        progress: 0,
        completedActivities: 0,
        totalActivities: stage.activities.length,
      };
    }

    let completedActivities = 0;
    let completedWeight = 0;

    for (const activity of stage.activities) {
      const indicatorCompleted = activity.indicatorKey
        ? Boolean(input.indicators[activity.indicatorKey])
        : false;
      const manualProgress = Boolean(input.activityCompletion.get(activity.key));
      const isDone = indicatorCompleted || manualProgress;

      if (isDone) {
        completedActivities += 1;
        completedWeight += activity.weight;
      }
    }

    return {
      key: stage.key,
      label: stage.label,
      progress: Math.round((completedWeight / totalWeight) * 100),
      completedActivities,
      totalActivities: stage.activities.length,
    };
  }
}
