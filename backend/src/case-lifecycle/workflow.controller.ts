import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CaseLifecycleService } from './case-lifecycle.service';
import { WorkflowStageResponseDto } from './dto/workflow-stage-response.dto';

@ApiTags('Workflow')
@ApiBearerAuth()
@Controller('workflow')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class WorkflowController {
  constructor(private readonly lifecycleService: CaseLifecycleService) {}

  @Get('stages')
  @ApiOperation({ summary: 'Obtener configuracion dinamica del workflow de lifecycle' })
  @ApiResponse({ status: 200, type: [WorkflowStageResponseDto] })
  getStages() {
    return this.lifecycleService.getWorkflowStages();
  }
}
