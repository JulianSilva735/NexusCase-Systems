import { PartialType } from '@nestjs/mapped-types';
import { CreateQuestionDto } from './create-survey.dto';

export class UpdateSurveyDto extends PartialType(CreateQuestionDto) {}
