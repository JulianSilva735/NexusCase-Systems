import { PartialType } from '@nestjs/mapped-types';
import { CreateCaseDto } from './create-case.dto';
import { IsString, IsOptional, IsEmail, IsEnum, IsDateString } from 'class-validator';
import { CasePriority, CaseStatus } from '../entities/case.entity';

export class UpdateCaseDto extends PartialType(CreateCaseDto) {
    @IsOptional()
    surveyAnswers?: any;

    @IsOptional()
    @IsString()
    clientFatherPhone?: string;

    @IsOptional()
    @IsEmail()
    clientFatherEmail?: string;

    @IsOptional()
    @IsString()
    clientMotherPhone?: string;

    @IsOptional()
    @IsEmail()
    clientMotherEmail?: string;

    @IsOptional()
    @IsEnum(CasePriority)
    priority?: CasePriority;

    @IsOptional()
    @IsDateString()
    deadline?: Date;

    @IsOptional()
    @IsString()
    clientAddress?: string;

    @IsOptional()
    @IsString()
    clientGender?: string;

    @IsOptional()
    @IsString()
    clientDob?: string;

    @IsOptional()
    @IsString()
    clientPob?: string;

    @IsOptional()
    @IsString()
    clientExpeditionPlace?: string;

    @IsOptional()
    @IsString()
    clientFatherName?: string;

    @IsOptional()
    @IsString()
    clientFatherId?: string;

    @IsOptional()
    @IsString()
    clientFatherAge?: string;

    @IsOptional()
    @IsString()
    clientMotherName?: string;

    @IsOptional()
    @IsString()
    clientMotherId?: string;

    @IsOptional()
    @IsString()
    clientMotherAge?: string;

    @IsOptional()
    @IsEnum(CaseStatus)
    status?: CaseStatus;
}