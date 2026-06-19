import { IsString, IsNotEmpty, IsBoolean, IsOptional, IsEnum, IsArray, ValidateNested, IsNumber, IsUUID } from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { QuestionType } from '../entities/question-type.enum';

export class CreateOptionDto {
    @IsString()
    @IsNotEmpty()
    label: string;

    @IsArray()
    @IsOptional()
    @IsString({ each: true })
    triggeredDocuments?: string[]; // Array of document types (strings)

    @IsString()
    @IsOptional()
    @Transform(({ value }) => (!value || value === 'undefined' || value === 'null') ? null : value)
    value?: string; // Allow 'value' from frontend (ignored or used as label alias)

    @IsOptional()
    @IsBoolean()
    requiresDocument?: boolean;
}

export class CreateQuestionDto {
    @IsString()
    @IsNotEmpty()
    statement: string;

    @IsString()
    @IsOptional()
    type?: string;

    @IsString()
    @IsNotEmpty()
    inputType: string;

    @IsBoolean()
    @IsOptional()
    isRequired?: boolean;

    @IsNumber()
    @IsOptional()
    order?: number;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => CreateOptionDto)
    @IsOptional()
    @Transform(({ value, obj }) => {
        // Si el tipo no requiere opciones (ej: Texto Abierto), limpiamos el array
        const effectiveType = obj.inputType || obj.type;
        if (effectiveType === QuestionType.OPEN_TEXT) return [];
        return value;
    })
    options?: CreateOptionDto[];

    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    requiredDocumentTypeIds?: number[];

    @IsUUID()
    @IsOptional()
    @Transform(({ value }) => (!value || value === 'undefined' || value === 'null') ? null : value)
    activationOptionId?: string | null;
}

export class CreateSurveySectionDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsNumber()
    order: number;
    
    @IsString()
    @IsOptional()
    description?: string;
}
