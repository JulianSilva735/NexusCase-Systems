import { Injectable, NotFoundException, BadRequestException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm'; // <--- AGREGADO: Between
import { Case, CaseStatus } from './entities/case.entity';
import { User } from '../users/entities/user.entity';
import { DocumentStatus } from '../documents/entities/document-status.enum';
import { CaseHistory } from './entities/case-history.entity';
import { Relative } from '../relatives/entities/relative.entity';
import { Document as CaseDocument } from '../documents/entities/document.entity';
import { CaseActivity } from './entities/case-activity.entity';
import { CreateCaseDto } from './dto/create-case.dto';
import { UpdateCaseDto } from './dto/update-case.dto';
import { CaseState } from './entities/case-state.entity';

import { RelativesService } from '../relatives/relatives.service';
import { DocumentsService } from '../documents/documents.service';
import { STAGES_CONFIG, INITIAL_STATES, StageActivityConfig } from './cases.constants';


import { SurveysService } from '../surveys/surveys.service';

@Injectable()
export class CasesService implements OnModuleInit {
  constructor(
    @InjectRepository(Case)
    private readonly casesRepository: Repository<Case>,

    @InjectRepository(CaseHistory)
    private readonly historyRepository: Repository<CaseHistory>,

    private readonly relativesService: RelativesService,
    private readonly documentsService: DocumentsService,
    private readonly surveysService: SurveysService,

    @InjectRepository(CaseActivity)
    private readonly activityRepository: Repository<CaseActivity>,

    @InjectRepository(CaseState)
    private readonly stateRepository: Repository<CaseState>,
  ) { }

  async onModuleInit() {
    await this.seedStates();
  }

  private async seedStates() {
    const count = await this.stateRepository.count();
    if (count > 0) return;

    const initialStates = INITIAL_STATES;


    for (const s of initialStates) {
      const state = this.stateRepository.create({
        id: s.id,
        label: s.label,
        order: s.order,
        maxDays: s.maxDays,
        description: s.desc
      });
      await this.stateRepository.save(state);
    }
  }

  async getAllStates() {
    return this.stateRepository.find({
      order: { order: 'ASC' }
    });
  }

  async updateState(id: string, data: Partial<CaseState>) {
    delete data.id;
    await this.stateRepository.update(id, data);
    return this.stateRepository.findOneBy({ id });
  }

  // --- MÉTODOS DE CASOS ---

  async create(createCaseDto: CreateCaseDto, user: User) {
    const uniqueCode = `CAS-${Date.now()}`;

    const newCase = this.casesRepository.create({
      ...createCaseDto,
      caseCode: uniqueCode,
      assignedTo: user,
      status: CaseStatus.NUEVO
    });

    return this.casesRepository.save(newCase);
  }

  findAll() {
    return this.casesRepository.find({
      relations: {
        assignedTo: true
      },
      order: { createdAt: 'DESC' }
    });
  }

  async findOne(id: string) {
    const caseFound = await this.casesRepository.findOne({
      where: { id },
      relations: {
        assignedTo: true,
        documents: true,
        relatives: true,
        history: { user: true },
        stateConfig: true
      },
      order: {
        history: { timestamp: 'DESC' }
      }
    });
    if (!caseFound) throw new NotFoundException('Caso no encontrado');
    return caseFound;
  }

  async update(id: string, updateCaseDto: UpdateCaseDto, user: User) {
    const result = await this.casesRepository.update(id, updateCaseDto);

    if (result.affected === 0) {
      throw new NotFoundException(`El caso con ID ${id} no existe`);
    }

    // --- LOGIC: GENERATE DOCUMENTS FROM SURVEY ---
    if (updateCaseDto.surveyAnswers) {
      // Procesa la lógica avanzada de la encuesta y crea documentos requeridos
      await this.surveysService.submitResponses(id, { responses: updateCaseDto.surveyAnswers });
    }

    await this.logHistory(
      id,
      user,
      'Actualización de Datos',
      'Se modificó la información básica del titular.'
    );

    return this.findOne(id);
  }

  remove(id: string) {
    return this.casesRepository.delete(id);
  }


  async cancelCase(id: string, reason: string, user: User) {
    const caseEntity = await this.findOne(id);

    if (caseEntity.status === CaseStatus.FINALIZADO || caseEntity.status === CaseStatus.CANCELADO) {
      throw new BadRequestException('El caso ya está cerrado.');
    }

    caseEntity.status = CaseStatus.CANCELADO;
    await this.casesRepository.save(caseEntity);

    await this.logHistory(id, user, 'Caso Cancelado', `Motivo: ${reason}`);

    return caseEntity;
  }

  async advanceState(id: string) {
    const caseEntity = await this.casesRepository.findOne({
      where: { id },
      relations: {
        documents: true
      }
    });

    if (!caseEntity) throw new NotFoundException('Caso no encontrado');

    switch (caseEntity.status) {
      case CaseStatus.NUEVO:
        caseEntity.status = CaseStatus.RECOLECCION;
        break;

      case CaseStatus.RECOLECCION:
        const pendingDocs = caseEntity.documents.filter(
          d => d.status !== DocumentStatus.APPROVED
        );
        if (pendingDocs.length > 0 && pendingDocs.some(d => d.status === DocumentStatus.REJECTED)) {
          throw new BadRequestException(
            `No se puede avanzar. Hay documentos rechazados que deben corregirse.`
          );
        }
        caseEntity.status = CaseStatus.ANALISIS;
        break;

      case CaseStatus.ANALISIS:
        caseEntity.status = CaseStatus.COMITE;
        break;

      case CaseStatus.COMITE:
        caseEntity.status = CaseStatus.FINALIZADO;
        break;

      case CaseStatus.FINALIZADO:
      case CaseStatus.CANCELADO:
        throw new BadRequestException('El caso ya está cerrado y no puede avanzar.');

      default:
        throw new BadRequestException(`Estado no configurado para avance automático: ${caseEntity.status}`);
    }

    return this.casesRepository.save(caseEntity);
  }

  async addRelative(caseId: string, data: any) {
    const caseFound = await this.findOne(caseId); // Verify case exists logic
    const createDto = { ...data, caseId };
    await this.relativesService.create(createDto);
    return this.findOne(caseId);
  }

  async removeRelative(caseId: string, relativeId: string) {
    await this.relativesService.remove(relativeId);
    return this.findOne(caseId);
  }

  async updateRelative(caseId: string, relativeId: string, data: any) {
    await this.relativesService.update(relativeId, data);
    return this.findOne(caseId);
  }

  async saveDocumentRecord(caseId: string, fileName: string, docName: string) {
    return this.documentsService.registerUploadedDocument(caseId, fileName, docName);
  }

  // 👇👇👇 AQUÍ ESTÁ LA MAGIA ACTUALIZADA 👇👇👇
  async getDashboardStats() {
    const alertDate = new Date();
    alertDate.setDate(alertDate.getDate() + 5);

    const activeCasesList = await this.casesRepository.find({
      where: [
        { status: CaseStatus.NUEVO },
        { status: CaseStatus.RECOLECCION },
        { status: CaseStatus.ANALISIS },
        { status: CaseStatus.COMITE }
      ],
      relations: ['documents'],
    });

    let totalPendingDocs = 0;
    for (const c of activeCasesList) {
      const requiredList = await this.surveysService.evaluateRequirements(c.surveyAnswers);
      const uploadedList = c.documents ? c.documents.map(d => d.name) : [];
      const missing = requiredList.filter(req => !uploadedList.includes(req));
      totalPendingDocs += missing.length;
    }

    const upcomingExpirations = await this.casesRepository.createQueryBuilder('case')
      .where('case.status NOT IN (:...closedStatuses)', { closedStatuses: [CaseStatus.FINALIZADO, CaseStatus.CANCELADO] })
      .andWhere('case.deadline IS NOT NULL')
      .andWhere('case.deadline <= :alertDate', { alertDate })
      .getCount();

    // --- FILTRO DE FECHAS PARA MES ACTUAL ---
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);

    const closedMonth = await this.casesRepository.count({
      where: {
        status: CaseStatus.FINALIZADO,
        updatedAt: Between(firstDay, lastDay)
      }
    });

    return {
      activeCases: activeCasesList.length,
      pendingDocuments: totalPendingDocs,
      upcomingExpirations: upcomingExpirations,
      closedMonth: closedMonth,
    };
  }
  // 👆👆👆 FIN DE LO NUEVO 👆👆👆



  async addCaseComment(caseId: string, comment: string, user: User) {
    const mentions = comment.match(/@\w+/g);

    const newLog = this.historyRepository.create({
      case: { id: caseId } as Case,
      user: user,
      action: 'NOTA_USUARIO',
      description: 'Nota agregada manualmente',
      type: 'COMMENT',
      userComment: comment
    });

    return await this.historyRepository.save(newLog);
  }

  async logHistory(caseId: string, user: User, action: string, description?: string) {
    const newLog = this.historyRepository.create({
      case: { id: caseId } as Case,
      user: user,
      action: action,
      description: description || '',
      type: 'SYSTEM'
    });
    return await this.historyRepository.save(newLog);
  }

  async getAllCasesWithStats() {
    const cases = await this.casesRepository.find({
      relations: ['activities', 'documents', 'assignedTo'],
      order: { updatedAt: 'DESC' }
    });

    return Promise.all(cases.map(async c => {
      const currentStageConfig: StageActivityConfig[] = STAGES_CONFIG[c.status] || [];

      let progress = 0;

      const completedMap: Record<string, boolean> = {};
      if (c.activities) {
        c.activities.forEach(a => completedMap[a.activityKey] = a.isCompleted);
      }

      // Lógica específica para etapas
      if (c.status === CaseStatus.RECOLECCION) {
        const requiredDocs = await this.surveysService.evaluateRequirements(c.surveyAnswers);
        // Filtrar documentos que NO estén rechazados (Aprobados o Subidos cuentan como progreso de 'intento')
        // O si quieres ser estricto, solo APPROVED. Aquí mantenemos lógica de "no rejected".
        const uploadedDocs = c.documents?.filter(d => d.status !== DocumentStatus.REJECTED).length || 0;
        const totalReq = requiredDocs.length || 1;

        // El progreso de documentos es proporcional
        progress = (uploadedDocs / totalReq) * 100;

      } else {
        // Cálculo estándar basado en pesos de actividades
        currentStageConfig.forEach(item => {
          if (completedMap[item.key]) {
            progress += item.weight;
          }
        });
      }

      const advisorName = c.assignedTo ? c.assignedTo.fullName : 'Sin Asignar';

      return {
        id: c.id,
        code: c.caseCode,
        client: c.clientName,
        advisor: advisorName,
        status: c.status,
        stageLabel: c.status, // Devolvemos el status como label, o mapear a nombres amigables si se prefiere
        progress: Math.min(Math.round(progress), 100)
      };
    }));
  }

  async getCaseStatistics(id: string) {
    const caseFound = await this.findOne(id);

    const activitiesDB = await this.activityRepository.find({
      where: { case: { id } }
    });

    const checklistMap: Record<string, boolean> = {};
    activitiesDB.forEach(act => {
      checklistMap[act.activityKey] = act.isCompleted;
    });

    const requiredDocs = await this.surveysService.evaluateRequirements(caseFound.surveyAnswers);

    const uploadedDocs = caseFound.documents
      ? caseFound.documents.filter(d => d.status !== DocumentStatus.REJECTED).map(d => d.name)
      : [];

    const docsDetail = requiredDocs.map(reqName => ({
      name: reqName,
      isUploaded: uploadedDocs.includes(reqName)
    }));

    const matches = requiredDocs.filter(req => uploadedDocs.includes(req));

    return {
      checklist: checklistMap,
      documents: {
        total: requiredDocs.length || 1,
        uploaded: matches.length,
        details: docsDetail
      }
    };
  }

  async updateChecklistActivity(caseId: string, activityKey: string, value: boolean) {
    const caseFound = await this.casesRepository.findOneBy({ id: caseId });
    if (!caseFound) throw new NotFoundException('Caso no encontrado');

    let activity = await this.activityRepository.findOne({
      where: {
        case: { id: caseId },
        activityKey: activityKey
      }
    });

    if (activity) {
      activity.isCompleted = value;
    } else {
      activity = this.activityRepository.create({
        case: caseFound,
        activityKey: activityKey,
        isCompleted: value
      });
    }

    return this.activityRepository.save(activity);
  }
}