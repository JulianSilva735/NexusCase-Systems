import { IsString, IsNotEmpty, IsEnum, IsUUID, IsOptional } from 'class-validator';
import { DocumentType } from '../entities/document-status.enum';

export class CreateDocumentDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsEnum(DocumentType)
  @IsNotEmpty()
  type: DocumentType;

  @IsUUID()
  @IsNotEmpty()
  caseId: string;

  @IsString()
  @IsOptional()
  url?: string;

  @IsString()
  @IsOptional()
  mimeType?: string;
}