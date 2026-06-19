import { IsOptional, IsString } from 'class-validator';

export class GenerateDocumentDto {
    @IsOptional()
    @IsString()
    relativeId?: string;
}
