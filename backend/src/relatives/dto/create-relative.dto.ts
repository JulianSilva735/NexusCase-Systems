import { RelationshipType } from '../entities/relative.entity';

export class CreateRelativeDto {
  firstName: string;
  lastName: string;
  relationship: RelationshipType;
  age?: number;
  identification?: string;
  
  caseId: string;
}