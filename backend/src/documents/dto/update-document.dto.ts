import { IsEnum, IsOptional, IsString, ValidateIf, IsNotEmpty } from 'class-validator';
import { DocumentStatus } from '../entities/document-status.enum';

export class UpdateDocumentDto {
  @IsOptional()
  @IsEnum(DocumentStatus)
  status?: DocumentStatus;

  // Validación condicional: Si el status es REJECTED, rejectionReason no puede estar vacío.
  @ValidateIf((o) => o.status === DocumentStatus.REJECTED)
  @IsString()
  @IsNotEmpty({ message: 'El motivo de rechazo es obligatorio al rechazar un documento.' })
  rejectionReason?: string;
}