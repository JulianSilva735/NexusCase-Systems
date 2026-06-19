import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  UseGuards, 
  Request, 
  Patch, 
  Param, 
  Delete,
  ParseUUIDPipe,
  UseInterceptors, 
  UploadedFile, 
  BadRequestException 
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

import { CasesService } from './cases.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PermissionsGuard } from '../auth/guards/permissions.guard';
import { RequirePermissions } from '../auth/decorators/permissions.decorator';
import { UserPermission } from '../users/entities/user.entity';

// DTOs
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CreateRelativeDto } from './dto/create-relative.dto';

@Controller('cases')
@UseGuards(JwtAuthGuard, PermissionsGuard) 
export class CasesController {
  constructor(private readonly casesService: CasesService) {}

  @Post()
  create(@Body() createCaseDto: CreateCaseDto, @Request() req) {
    return this.casesService.create(createCaseDto, req.user);
  }

  @Get()
  findAll() {
    return this.casesService.findAll();
  }

  // 👇👇👇 NUEVOS ENDPOINTS PARA ADMIN DE ESTADOS 👇👇👇
  // (Deben ir ANTES de :id para que no se confundan)
  
  @Get('states') 
  getStates() {
    return this.casesService.getAllStates();
  }

  @Patch('states/:id')
  @RequirePermissions(UserPermission.MANAGE_TIME)
  updateState(
    @Param('id') id: string,
    @Body() body: any 
  ) {
    return this.casesService.updateState(id, body);
  }
  // 👆👆👆 FIN DE LO NUEVO 👆👆👆

  @Get('dashboard-stats') 
  getDashboardStats() {
    return this.casesService.getDashboardStats();
  }

  @Get('global-stats')
  @RequirePermissions(UserPermission.VIEW_ADMIN_STATS)
  getGlobalStats() {
    return this.casesService.getAllCasesWithStats();
  }

  @Get(':id') // Este "comodín" debe ir después de las rutas fijas (como 'states' o 'dashboard-stats')
  findOne(@Param('id', ParseUUIDPipe) id: string) { 
    return this.casesService.findOne(id);
  }

  @Post(':id/comment')
  addComment(
    @Param('id', ParseUUIDPipe) id: string,
    @Body('comment') comment: string,
    @Request() req
  ) {
    if (!comment) {
        throw new BadRequestException('El comentario es obligatorio');
    }
    return this.casesService.addCaseComment(id, comment, req.user);
  }

  @Post(':id/documents')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads', 
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname).toLowerCase();
        const filename = `DOC-${uniqueSuffix}${ext}`;
        callback(null, filename);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      const allowedMimes = [
        'application/pdf',
        'image/jpeg',
        'image/png',
        'image/webp',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];
      const allowedExts = ['.pdf', '.jpg', '.jpeg', '.png', '.webp', '.doc', '.docx'];
      const ext = extname(file.originalname).toLowerCase();

      if (!allowedMimes.includes(file.mimetype) || !allowedExts.includes(ext)) {
        return callback(new BadRequestException('Tipo de archivo no permitido. Solo se aceptan PDF, imágenes y documentos Word.'), false);
      }
      callback(null, true);
    },
  }))
  async uploadDocument(
    @Param('id', ParseUUIDPipe) caseId: string,
    @UploadedFile() file: Express.Multer.File,
    @Body('docName') docName: string 
  ) {
    if (!file) {
      throw new BadRequestException('No se ha subido ningún archivo');
    }

    if (!docName) {
        throw new BadRequestException('Se requiere el nombre del documento (docName)');
    }

    return this.casesService.saveDocumentRecord(caseId, file.filename, docName);
  }

  @Post(':id/relatives')
  addRelative(
      @Param('id', ParseUUIDPipe) id: string, 
      @Body() relativeDto: CreateRelativeDto 
  ) {
      return this.casesService.addRelative(id, relativeDto);
  }

  @Patch(':id')
  update(
    @Param('id', ParseUUIDPipe) id: string, 
    @Body() updateCaseDto: UpdateCaseDto,
    @Request() req
  ) {
    return this.casesService.update(id, updateCaseDto, req.user);
  }

  @Patch(':id/advance')
  advanceStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.casesService.advanceState(id);
  }

  @Patch(':id/cancel')
  async cancel(@Param('id', ParseUUIDPipe) id: string, @Body('reason') reason: string, @Request() req) {
    return this.casesService.cancelCase(id, reason, req.user);
  }

  @Patch(':id/relatives/:relativeId')
  updateRelative(
    @Param('id', ParseUUIDPipe) caseId: string,
    @Param('relativeId', ParseUUIDPipe) relativeId: string,
    @Body() updateData: any,
  ) {
    return this.casesService.updateRelative(caseId, relativeId, updateData);
  }

  @Delete(':id/relatives/:relativeId')
  removeRelative(
    @Param('id', ParseUUIDPipe) id: string,
    @Param('relativeId', ParseUUIDPipe) relativeId: string
  ) {
    return this.casesService.removeRelative(id, relativeId);
  }

  @Get(':id/statistics')
  getStats(@Param('id') id: string) {
    return this.casesService.getCaseStatistics(id);
  }

  @Patch(':id/statistics')
  updateStats(
    @Param('id') id: string,  
    @Body() body: { activity: string; value: boolean }
  ) {
    return this.casesService.updateChecklistActivity(id, body.activity, body.value);
  }
}