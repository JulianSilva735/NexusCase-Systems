import { ApiProperty } from '@nestjs/swagger';

class WorkflowActivityDto {
  @ApiProperty({ example: 'client_located' })
  key: string;

  @ApiProperty({ example: 'Cliente ubicado' })
  label: string;

  @ApiProperty({ example: 100 })
  weight: number;

  @ApiProperty({ example: 'client_located', required: false })
  indicatorKey?: string;
}

export class WorkflowStageResponseDto {
  @ApiProperty({ example: 'UBICADO' })
  key: string;

  @ApiProperty({ example: 'Ubicado' })
  label: string;

  @ApiProperty({ example: 2 })
  order: number;

  @ApiProperty({ type: [WorkflowActivityDto] })
  activities: WorkflowActivityDto[];

  @ApiProperty({ example: false })
  is_terminal: boolean;
}
