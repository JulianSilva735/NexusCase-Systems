import { IsString, IsNotEmpty, IsEnum, IsInt, IsBoolean, IsOptional, IsArray } from 'class-validator';
import { QuestionType } from '../entities/question-type.enum';
import { DocumentType } from '../../documents/entities/document-status.enum';

export class CreateQuestionDto {
  @IsString()
  @IsNotEmpty()
  statement: string;

  @IsInt()
  @IsNotEmpty()
  order: number;

  @IsEnum(QuestionType)
  @IsNotEmpty()
  type: QuestionType;

  @IsBoolean()
  @IsOptional()
  isRequired?: boolean;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  options?: string[];

  @IsEnum(DocumentType)
  @IsOptional()
  triggerDocumentType?: DocumentType;
}