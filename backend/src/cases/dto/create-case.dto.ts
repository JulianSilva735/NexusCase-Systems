import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsNumber,IsEmail } from 'class-validator';

export class CreateCaseDto {
  @IsString()
  @IsNotEmpty()
  clientName: string;

  @IsString()
  @IsNotEmpty()
  clientIdNumber: string;

  @IsString()
  @IsOptional()
  clientPhone?: string;

  @IsBoolean()
  @IsOptional()
  isInterested?: boolean;

  @IsString()
  @IsOptional()
  @IsEmail() 
  clientEmail?: string;

  @IsNumber()
  @IsOptional()
  caseTypeId?: number;

  @IsOptional()
  surveyData?: any;

  @IsOptional()
  surveyAnswers?: any;
}