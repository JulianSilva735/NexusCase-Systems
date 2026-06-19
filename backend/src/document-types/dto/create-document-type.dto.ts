import { IsBoolean, IsOptional, IsString, IsArray, IsIn } from 'class-validator';

export class CreateDocumentTypeDto {
  @IsString()
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsBoolean()
  @IsOptional()
  isMandatory?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsArray()
  @IsOptional()
  @IsIn(['PDF', 'JPG', 'WORD'], { each: true })
  allowedFormats?: string[];

  @IsString()
  @IsOptional()
  templateUrl?: string;
}