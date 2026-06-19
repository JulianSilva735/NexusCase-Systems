import { BadRequestException, Injectable, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentDto } from './dto/create-document.dto';
import { UpdateDocumentDto } from './dto/update-document.dto';
import { Document } from './entities/document.entity';
import { Case } from '../cases/entities/case.entity';
import { User } from '../users/entities/user.entity';
import { DocumentStatus } from './entities/document-status.enum';

import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import * as fs from 'fs';
import * as path from 'path';
import { Relative } from '../relatives/entities/relative.entity';

@Injectable()
export class DocumentsService {
  constructor(
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
  ) { }

  async create(createDocumentDto: CreateDocumentDto, user: User, file?: Express.Multer.File) {
    const caseFound = await this.caseRepository.findOne({
      where: { id: createDocumentDto.caseId }
    });

    if (!caseFound) throw new NotFoundException(`Caso con ID ${createDocumentDto.caseId} no encontrado`);

    // Buscar si existe un placeholder pendiente (ej: generado por encuesta)
    const existingPlaceholder = await this.documentRepository.findOne({
      where: {
        case: { id: createDocumentDto.caseId },
        type: createDocumentDto.type,
        status: DocumentStatus.PENDING,
      }
    });

    if (existingPlaceholder) {
      existingPlaceholder.uploadedBy = user;
      existingPlaceholder.url = file ? file.path : 'no-file';
      existingPlaceholder.path = file ? file.path : undefined;
      existingPlaceholder.mimeType = file ? file.mimetype : null;
      existingPlaceholder.originalName = file ? file.originalname : null;

      // Si el placeholder no tenía nombre asignado, le ponemos el del archivo subido
      if (!existingPlaceholder.name && file) {
        existingPlaceholder.name = file.originalname;
      }

      return await this.documentRepository.save(existingPlaceholder);
    }

    const lastDoc = await this.documentRepository.findOne({
      where: { case: { id: createDocumentDto.caseId }, type: createDocumentDto.type },
      order: { version: 'DESC' }
    });

    const newVersion = lastDoc ? lastDoc.version + 1 : 1;
    if (newVersion > 10) throw new BadRequestException('Límite de versiones alcanzado.');

    const newDoc = this.documentRepository.create({
      ...createDocumentDto,
      version: newVersion,
      case: caseFound,
      uploadedBy: user,
      status: DocumentStatus.PENDING,
      url: file ? file.path : 'no-file',
      path: file ? file.path : undefined,
      mimeType: file ? file.mimetype : null,
      originalName: file ? file.originalname : null,
      name: file ? file.originalname : createDocumentDto.type,
    });

    return await this.documentRepository.save(newDoc);
  }

  async findAllByCase(caseId: string) {
    return this.documentRepository.find({
      where: { case: { id: caseId } },
      order: { type: 'ASC', version: 'DESC' },
      relations: ['uploadedBy']
    });
  }

  findAll() { return this.documentRepository.find({ relations: ['case'] }); }

  findOne(id: string) {
    return this.documentRepository.findOne({ where: { id }, relations: ['case', 'uploadedBy'] });
  }

  async update(id: string, updateDocumentDto: UpdateDocumentDto) {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (!doc) throw new NotFoundException(`Documento ${id} no encontrado`);

    if (updateDocumentDto.status) doc.status = updateDocumentDto.status;
    if (updateDocumentDto.rejectionReason !== undefined) doc.rejectionReason = updateDocumentDto.rejectionReason;
    if (doc.status === DocumentStatus.APPROVED) doc.rejectionReason = null;

    return await this.documentRepository.save(doc);
  }

  async remove(id: string) {
    const doc = await this.documentRepository.findOne({ where: { id } });
    if (doc && doc.path && fs.existsSync(doc.path)) {
      try {
        fs.unlinkSync(doc.path); // Borra el archivo
      } catch (e) {
        console.error("No se pudo borrar el archivo físico", e);
      }
    }
    return this.documentRepository.delete(id);
  }
  async createRequiredDocument(caseId: string, documentType: string) {
    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity) {
      console.error(`[DOCUMENTS] Case not found: ${caseId}`);
      throw new NotFoundException(`Case ${caseId} not found when creating required document`);
    }

    const existing = await this.documentRepository.findOne({
      where: { case: { id: caseId }, type: documentType }
    });
    
    if (existing) {
      return existing;
    }

    const newDoc = this.documentRepository.create({
      type: documentType,
      status: DocumentStatus.PENDING,
      version: 1,
      case: caseEntity,
      mimeType: null,
      originalName: 'Requerido por Encuesta',
      url: '',
      name: `${documentType} (Pendiente)`,
      path: null
    });

    try {
      const savedDoc = await this.documentRepository.save(newDoc);
      return savedDoc;
    } catch (err: any) {
      console.error(`[DOCUMENTS] Error creating required document:`, { caseId, documentType, error: err.message });
      throw err;
    }
  }

  async generateDocumentFromTemplate(caseId: string, templateType: string, user: User, relativeId?: string) {
    const caseData = await this.caseRepository.findOne({
      where: { id: caseId },
      relations: ['relatives', 'assignedTo']
    });

    if (!caseData) throw new NotFoundException('Caso no encontrado');

    let relative: Relative | undefined;

    if (relativeId === 'virtual-father') {
      relative = {
        id: 'virtual-father',
        firstName: caseData.clientFatherName || '',
        lastName: '',
        relationship: 'Padre (Titular)',
        identification: caseData.clientFatherId,
        phone: caseData.clientFatherPhone,
        email: caseData.clientFatherEmail,
        age: caseData.clientFatherAge,
        address: caseData.clientAddress, // Fallback to client address
        pob: caseData.clientPob          // Fallback
      } as unknown as Relative;
    } else if (relativeId === 'virtual-mother') {
      relative = {
        id: 'virtual-mother',
        firstName: caseData.clientMotherName || '',
        lastName: '',
        relationship: 'Madre (Titular)',
        identification: caseData.clientMotherId,
        phone: caseData.clientMotherPhone,
        email: caseData.clientMotherEmail,
        age: caseData.clientMotherAge,
        address: caseData.clientAddress,
        pob: caseData.clientPob
      } as unknown as Relative;
    } else if (relativeId) {
      relative = caseData.relatives.find(r => r.id === relativeId);
      if (!relative) throw new NotFoundException('Familiar no encontrado en este caso');
    }

    const dataToFill = this._mapCaseToTemplateData(caseData, user, relative);

    const templateFileName = `${templateType}.docx`;
    const templatePath = path.resolve(process.cwd(), 'src/templates', templateFileName);
    const outputDir = path.resolve(process.cwd(), 'uploads', 'generated');

    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    try {
      if (!fs.existsSync(templatePath)) {
        throw new NotFoundException(`Plantilla ${templateFileName} no encontrada en src/templates`);
      }

      const content = fs.readFileSync(templatePath, 'binary');
      const zip = new PizZip(content);

      const doc = new Docxtemplater(zip, {
        paragraphLoop: true,
        linebreaks: true,
        delimiters: { start: '[[', end: ']]' }
      });

      doc.render(dataToFill);

      const buf = doc.getZip().generate({
        type: 'nodebuffer',
        compression: 'DEFLATE',
      });

      // Si es para un familiar, incluimos su nombre en el archivo
      const subjectName = relative
        ? `${relative.firstName} ${relative.lastName}`
        : caseData.clientName;

      const outputFileName = `${templateType}_${subjectName.trim().replace(/\s+/g, '_')}_${Date.now()}.docx`;
      const outputPath = path.join(outputDir, outputFileName);

      fs.writeFileSync(outputPath, buf);

      let existingDoc = await this.documentRepository.findOne({
        where: { case: { id: caseId }, type: templateType, status: DocumentStatus.PENDING }
      });

      if (!existingDoc) {
        existingDoc = this.documentRepository.create({
          case: caseData,
          type: templateType,
          version: 1,
          status: DocumentStatus.APPROVED,
          name: outputFileName,
        });
      } else {
        existingDoc.name = outputFileName;
      }

      // --- ASIGNACIÓN DE CAMPOS ---
      existingDoc.url = outputPath;
      existingDoc.path = outputPath;
      existingDoc.originalName = outputFileName;
      existingDoc.mimeType = 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      existingDoc.uploadedBy = user;
      existingDoc.status = DocumentStatus.APPROVED;

      if (!existingDoc.name) existingDoc.name = outputFileName;

      return await this.documentRepository.save(existingDoc);

    } catch (error: any) {
      console.error('Error generando documento:', error);
      if (error.properties && error.properties.errors) {
        throw new BadRequestException(`Error en plantilla: ${error.properties.errors.map(e => e.message).join(', ')}`);
      }
      throw error;
    }
  }
  // --- HELPER PRIVADO PARA MAPEO DE DATOS ---
  private _mapCaseToTemplateData(c: Case, currentUser: User, relative?: Relative) {
    const today = new Date();
    const dateStr = `${today.getDate()} de ${today.toLocaleString('es-CO', { month: 'long' })} de ${today.getFullYear()}`;

    // --- LÓGICA CORREGIDA ---
    // CAUSANTE (Fallecido): Es el titular del Caso (quien murió).
    const causanteName = c.clientName?.toUpperCase() || 'NOMBRE_CAUSANTE_NO_REGISTRADO';
    const causanteId = c.clientIdNumber || 'ID_CAUSANTE_NO_REGISTRADO';
    const causanteExpedicion = c.clientExpeditionPlace || '____________';

    // CLIENTE (Firmante): Debe ser el Familiar seleccionado.
    // Si no hay familiar seleccionado (relative undefined), dejamos vacíos o placeholders.
    let signerName = '____________';
    let signerId = '____________';
    let signerAddress = '____________';
    let signerEmail = '____________';
    let signerPhone = '____________';
    let signerPob = '____________'; // Lugar de nacimiento
    let signerRelation = 'Familiar';

    if (relative) {
      signerName = `${relative.firstName} ${relative.lastName}`.toUpperCase();
      signerId = relative.identification || 'SIN ID';
      signerAddress = relative.address || c.clientAddress || 'Dirección no registrada';
      signerEmail = relative.email || 'Sin email';
      signerPhone = relative.phone || 'Sin teléfono';
      signerPob = relative.pob || c.clientPob || '____________';
      signerRelation = relative.relationship || 'Familiar';
    } else {
      // Fallback porsi acaso se pide generar sin familiar (aunque no debería para poderes)
      console.warn('Generando documento sin familiar seleccionado. Los campos del firmante estarán vacíos.');
    }

    const u: any = currentUser;
    const operatorName = u.firstName ? `${u.firstName} ${u.lastName || ''}`.trim() : (u.name || 'Admin');

    return {
      fecha_actual: dateStr,
      ciudad_firma: 'N/A',

      // Mapeamos los campos del template a las variables calculadas (Firmante = Familiar)
      nombre_cliente: signerName,
      cedula_cliente: signerId,
      lugar_nacimiento: signerPob,
      ciudad_expedicion_cliente: '____________', // Dato que quizás falte en Relative entity

      direccion_cliente: signerAddress,
      email_cliente: signerEmail,
      telefono_cliente: signerPhone,

      // Datos del Causante (El titular del caso)
      relacion_causante: signerRelation,
      nombre_causante: causanteName,
      cedula_causante: causanteId,
      ciudad_expedicion_causante: causanteExpedicion,

      nombre_empresa: 'NexusCase_prueba',
      nit_empresa: 'N/A',
      nombre_representante: 'N/A',
      cedula_representante: 'N/A',

      nombre_operador: operatorName,

      familiares: c.relatives ? c.relatives.map(rel => ({
        nombre_familiar: `${rel.firstName} ${rel.lastName}`.toUpperCase(),
        relacion: rel.relationship,
        cedula_familiar: rel.identification || 'N/A'
      })) : []
    };
  }

  async registerUploadedDocument(caseId: string, fileName: string, docName: string) {
    const caseFound = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseFound) throw new NotFoundException('Caso no encontrado');

    let document = await this.documentRepository.findOne({
      where: {
        case: { id: caseId },
        name: docName
      }
    });

    if (document) {
      document.path = `/uploads/${fileName}`;
      document.status = DocumentStatus.UPLOADED;
      document.type = docName;
    } else {
      document = this.documentRepository.create({
        name: docName,
        type: docName,
        path: `/uploads/${fileName}`,
        status: DocumentStatus.UPLOADED,
        case: caseFound
      });
    }

    await this.documentRepository.save(document);
    return { success: true, fileName, path: document.path };
  }
}