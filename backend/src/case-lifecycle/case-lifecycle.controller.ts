import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { CaseLifecycleService } from './case-lifecycle.service';
import { ManualLifecycleOverrideDto } from './dto/manual-override.dto';
import { CaseLifecycleResponseDto } from './dto/lifecycle-response.dto';
import { LifecycleHistoryResponseDto } from './dto/lifecycle-history-response.dto';

@ApiTags('Case Lifecycle')
@ApiBearerAuth()
@Controller('cases/:caseId/lifecycle')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CaseLifecycleController {
  constructor(private readonly lifecycleService: CaseLifecycleService) {}

  @Get()
  @ApiOperation({ summary: 'Obtener lifecycle del caso' })
  @ApiResponse({ status: 200, type: CaseLifecycleResponseDto })
  getLifecycle(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.lifecycleService.getCaseLifecycle(caseId);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Forzar recalculo de lifecycle' })
  @ApiResponse({ status: 200, type: CaseLifecycleResponseDto })
  recalculate(@Param('caseId', ParseUUIDPipe) caseId: string, @Request() req) {
    return this.lifecycleService.recalculate(caseId, req.user);
  }

  @Patch('manual')
  @ApiOperation({ summary: 'Aplicar override manual de etapa del caso' })
  @ApiResponse({ status: 200, type: CaseLifecycleResponseDto })
  manualOverride(
    @Param('caseId', ParseUUIDPipe) caseId: string,
    @Body() body: ManualLifecycleOverrideDto,
    @Request() req,
  ) {
    return this.lifecycleService.applyManualOverride(caseId, body, req.user);
  }

  @Get('history')
  @ApiOperation({ summary: 'Historial cronologico de cambios de etapa' })
  @ApiResponse({ status: 200, type: [LifecycleHistoryResponseDto] })
  getHistory(@Param('caseId', ParseUUIDPipe) caseId: string) {
    return this.lifecycleService.getLifecycleHistory(caseId);
  }
}
