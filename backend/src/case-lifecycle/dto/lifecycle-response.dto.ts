import { ApiProperty } from '@nestjs/swagger';

class ManualOverrideMetadataDto {
  @ApiProperty({ example: true })
  active: boolean;

  @ApiProperty({ example: 'CONTRATO_FIRMADO', nullable: true })
  target_stage: string | null;

  @ApiProperty({ example: 'Validado por supervisor', nullable: true })
  reason: string | null;

  @ApiProperty({ example: 'f86d4f34-2bd8-48b4-b829-9ab95f7379bb', nullable: true })
  user_id: string | null;

  @ApiProperty({ example: '2026-03-15T14:00:00.000Z', nullable: true })
  changed_at: string | null;
}

class StageLifecycleDto {
  @ApiProperty({ example: 'CONTACTADO' })
  key: string;

  @ApiProperty({ example: 'Contactado' })
  label: string;

  @ApiProperty({ example: 100 })
  progress: number;

  @ApiProperty({ example: 1 })
  completed_activities: number;

  @ApiProperty({ example: 1 })
  total_activities: number;

  @ApiProperty({ example: 'completed', enum: ['completed', 'current', 'pending'] })
  status: 'completed' | 'current' | 'pending';
}

export class CaseLifecycleResponseDto {
  @ApiProperty({ example: 'CONTACTADO' })
  current_stage: string;

  @ApiProperty({ example: 'Contactado' })
  current_stage_label: string;

  @ApiProperty({ type: [StageLifecycleDto] })
  stages: StageLifecycleDto[];

  @ApiProperty({ example: 'AUTO', enum: ['AUTO', 'MANUAL'] })
  source: 'AUTO' | 'MANUAL';

  @ApiProperty({ type: ManualOverrideMetadataDto })
  manual_override: ManualOverrideMetadataDto;
}
