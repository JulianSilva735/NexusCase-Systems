import { PartialType, OmitType } from '@nestjs/mapped-types';
import { CreateQuestionDto, CreateOptionDto } from './create-survey-structure.dto';
import { IsString, IsOptional, ValidateNested, IsArray, IsNotEmpty, IsUUID, IsNumber, IsBoolean } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class UpdateOptionDto extends PartialType(CreateOptionDto) {
    @IsString()
    @IsOptional()
    id?: string; // Optional: if present update, else create

    @IsString()
    @IsOptional()
    requiredDocumentType?: string | null; // Null to remove condition

    @IsString()
    @IsOptional()
    @Transform(({ value }) => (!value || value === 'undefined' || value === 'null') ? null : value)
    value?: string;

    @IsOptional()
    @IsBoolean()
    requiresDocument?: boolean;
}

export class UpdateQuestionDto extends PartialType(OmitType(CreateQuestionDto, ['options'] as const)) {
    @IsString()
    @IsOptional()
    id?: string;

    @IsArray()
    @ValidateNested({ each: true })
    @Type(() => UpdateOptionDto)
    @IsOptional()
    options?: UpdateOptionDto[];

    @IsArray()
    @IsNumber({}, { each: true })
    @IsOptional()
    requiredDocumentTypeIds?: number[];

    @IsUUID()
    @IsOptional()
    @Transform(({ value }) => value === '' ? null : value)
    parentQuestionId?: string;

    @IsUUID()
    @IsOptional()
    @Transform(({ value }) => (!value || value === 'undefined' || value === 'null') ? null : value)
    activationOptionId?: string | null;

    @IsString()
    @IsOptional()
    @Transform(({ value }) => value === '' ? null : value)
    triggerResponse?: string;

    @IsString()
    @IsOptional()
    inputType?: string;
}
