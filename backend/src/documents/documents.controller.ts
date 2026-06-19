import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  Query
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { DocumentsService } from './documents.service';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { GenerateDocumentDto } from './dto/generate-document.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('documents')
@UseGuards(JwtAuthGuard)
export class DocumentsController {
  constructor(private readonly documentsService: DocumentsService) { }

  // --- ENDPOINT DE SUBIDA MANUAL (EXISTENTE) ---
  @Post()
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
      },
    }),
    limits: { fileSize: 5 * 1024 * 1024 },
    fileFilter: (req, file, callback) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|pdf|plain|msword|vnd.openxmlformats-officedocument.wordprocessingml.document)$/)) {
        return callback(new BadRequestException('Formato de archivo no permitido'), false);
      }
      callback(null, true);
    },
  }))
  create(
    @Body() createDocumentDto: CreateDocumentDto,
    @UploadedFile() file: Express.Multer.File,
    @Request() req
  ) {
    if (!file) {
      throw new BadRequestException('El archivo es obligatorio');
    }
    return this.documentsService.create(createDocumentDto, req.user, file);
  }

  // ==========================================
  // 🚀 NUEVO ENDPOINT: GENERACIÓN AUTOMÁTICA
  // ==========================================
  @Post('generate/:caseId/:templateType')
  async generateDoc(
    @Param('caseId') caseId: string,
    @Param('templateType') templateType: string,
    @Query('relativeId') relativeIdQuery: string,
    @Body() body: any,
    @Request() req
  ) {
    try {
      const relativeId = relativeIdQuery || (body && body.relativeId);
      return await this.documentsService.generateDocumentFromTemplate(caseId, templateType, req.user, relativeId);
    } catch (e: any) {
      throw new BadRequestException(e.message || 'Error interno en generación');
    }
  }


  @Get()
  findAll() {
    return this.documentsService.findAll();
  }

  @Get('case/:caseId')
  findAllByCase(@Param('caseId') caseId: string) {
    return this.documentsService.findAllByCase(caseId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentsService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateDocumentDto: UpdateDocumentDto) {
    return this.documentsService.update(id, updateDocumentDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.documentsService.remove(id);
  }
}