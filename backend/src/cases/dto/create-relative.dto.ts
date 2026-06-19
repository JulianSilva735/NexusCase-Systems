// src/cases/dto/create-relative.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsNumber, IsEnum } from 'class-validator';

// Si tienes un enum de parentescos, úsalo aquí. Si no, déjalo como string por ahora.
// export enum RelationshipType { ... } 

export class CreateRelativeDto {
  @IsString()
  @IsNotEmpty()
  firstName: string;

  @IsString()
  @IsNotEmpty()
  lastName: string;

  @IsString()
  @IsNotEmpty()
  relationship: string;

  @IsOptional()
  @IsString()
  identification?: string;

  @IsOptional()
  @IsNumber()
  age?: number;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  email?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsString()
  pob?: string;
}