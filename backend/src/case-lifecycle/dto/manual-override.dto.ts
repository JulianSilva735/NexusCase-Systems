import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class ManualLifecycleOverrideDto {
  @ApiProperty({
    description: 'Etapa destino del override manual. Envie AUTO para desactivar override y volver a calculo automatico.',
    example: 'CONTRATO_FIRMADO',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  target_stage: string;

  @ApiProperty({
    description: 'Motivo de override o motivo de desactivacion del override.',
    example: 'Cliente confirmo firma fisica fuera del flujo digital',
    required: false,
  })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  reason?: string;

  @ApiProperty({
    description: 'Confirma override explicito para saltos manuales no consecutivos.',
    example: false,
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  force_invalid_transition?: boolean;
}
