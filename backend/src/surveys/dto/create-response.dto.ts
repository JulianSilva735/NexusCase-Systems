import { IsNotEmpty, IsString, IsUUID, IsArray, ValidateNested, IsOptional } from 'class-validator';
import { Type, Transform } from 'class-transformer';

export class SingleResponseDto {
  @IsUUID()
  @IsNotEmpty()
  questionId: string;

  @IsNotEmpty({ message: 'El valor de la respuesta no puede estar vacío' })
  value: string | number | boolean;

  @IsUUID()
  @IsOptional()
  relativeId?: string;
}
export class CreateBatchResponseDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SingleResponseDto)
  responses: SingleResponseDto[];
}