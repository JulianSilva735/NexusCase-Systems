import { ApiProperty } from '@nestjs/swagger';

export class LifecycleHistoryResponseDto {
  @ApiProperty({ example: 'a2a5fda2-87cc-447d-ae8f-2e8a4ac51506' })
  id: string;

  @ApiProperty({ example: 'CONTACTADO', nullable: true })
  from_stage: string | null;

  @ApiProperty({ example: 'CONTRATO_ENVIADO' })
  to_stage: string;

  @ApiProperty({ example: 'AUTO', enum: ['AUTO', 'MANUAL'] })
  source: 'AUTO' | 'MANUAL';

  @ApiProperty({ example: 'Ajuste operativo', nullable: true })
  reason: string | null;

  @ApiProperty({ example: 'f86d4f34-2bd8-48b4-b829-9ab95f7379bb', nullable: true })
  user_id: string | null;

  @ApiProperty({ example: '2026-03-15T15:09:12.009Z' })
  changed_at: string;
}
