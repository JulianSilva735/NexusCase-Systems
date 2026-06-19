import { IsOptional, IsUUID, IsDateString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class CaseStatsQueryDto {
  @IsOptional()
  @IsUUID('4', { message: 'El assignedUserId debe ser un UUID válido' })
  assignedUserId?: string;

  @IsOptional()
  @IsDateString({}, { message: 'startDate debe ser una fecha válida en formato ISO 8601' })
  startDate?: string;

  @IsOptional()
  @IsDateString({}, { message: 'endDate debe ser una fecha válida en formato ISO 8601' })
  endDate?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'limit debe ser un número entero' })
  @Min(1, { message: 'limit debe ser al menos 1' })
  @Max(1000, { message: 'limit no puede ser mayor a 1000' })
  limit?: number = 100;

  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'offset debe ser un número entero' })
  @Min(0, { message: 'offset debe ser al menos 0' })
  offset?: number = 0;
}
