import { Controller, Get, Post, Put, Body, Patch, Param, Delete, UseGuards, ParseUUIDPipe, ParseArrayPipe, HttpCode } from '@nestjs/common';
import { SurveysService } from './surveys.service';
import { CreateQuestionDto, CreateSurveySectionDto } from './dto/create-survey-structure.dto';
import { CreateBatchResponseDto } from './dto/create-response.dto'; // Importar DTO
import { UpdateQuestionDto } from './dto/update-survey-structure.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UserPermission } from '../users/entities/user.entity';

import { SurveysSeeder } from './surveys.seeder';

@Controller('surveys')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class SurveysController {
  constructor(
    private readonly surveysService: SurveysService,
    private readonly surveysSeeder: SurveysSeeder
  ) { }

  @Post('seed')
  @RequirePermissions(UserPermission.MANAGE_SURVEY)
  seed() {
    return this.surveysSeeder.seed();
  }

  @Post()
  @RequirePermissions(UserPermission.MANAGE_SURVEY)
  @HttpCode(201)
  async createSection(@Body() createSectionDto: CreateSurveySectionDto) {
    const created = await this.surveysService.createSection(createSectionDto);
    return created;
  }

  @Get()
  findAll() {
    return this.surveysService.findAll();
  }

  @Get(':id')
  findOne(@Param('id', new ParseUUIDPipe()) id: string) {
    return this.surveysService.findOne(id);
  }


  @Post('questions')
  @RequirePermissions(UserPermission.MANAGE_SURVEY)
  createQuestion(@Body() createDto: CreateQuestionDto) {
    return this.surveysService.createQuestion(createDto);
  }

  @Patch('questions/:id')
  @RequirePermissions(UserPermission.MANAGE_SURVEY)
  updateQuestion(
    @Param('id') id: string,
    @Body() updateDto: UpdateQuestionDto
  ) {
    return this.surveysService.updateQuestion(id, updateDto);
  }

  @Delete('questions/:id')
  @RequirePermissions(UserPermission.MANAGE_SURVEY)
  @HttpCode(204)
  deleteQuestion(@Param('id') id: string) {
    return this.surveysService.deleteQuestion(id);
  }

  // --- BULK UPDATE ENDPOINT ---
  @Put(':id/structure')
  @RequirePermissions(UserPermission.MANAGE_SURVEY)
  updateStructure(
    @Param('id', new ParseUUIDPipe()) id: string,
    @Body(new ParseArrayPipe({ items: UpdateQuestionDto })) questions: UpdateQuestionDto[]
  ) {
    return this.surveysService.updateStructure(id, questions);
  }

  // --- NUEVO ENDPOINT ---
  @Post('responses/:caseId')
  async submitResponses(
    @Param('caseId') caseId: string,
    @Body() dto: CreateBatchResponseDto,
  ) {
    return this.surveysService.submitResponses(caseId, dto);
  }

  // Support PUT from frontend "Guardar cambios" which previously used PUT
  @Put('responses/:caseId')
  async putResponses(
    @Param('caseId') caseId: string,
    @Body() dto: CreateBatchResponseDto,
  ) {
    return this.surveysService.submitResponses(caseId, dto);
  }
}