import { Injectable, NotFoundException, BadRequestException, OnModuleInit, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, IsNull } from 'typeorm';
import { CreateQuestionDto } from './dto/create-survey-structure.dto';
import { UpdateQuestionDto } from './dto/update-survey-structure.dto';
import { Question } from './entities/question.entity';
import { SurveyResponse } from './entities/survey-response.entity';
import { CreateBatchResponseDto } from './dto/create-response.dto';
import { DocumentsService } from '../documents/documents.service';
import { Case } from '../cases/entities/case.entity';
import { Relative } from '../relatives/entities/relative.entity';
import { Document } from '../documents/entities/document.entity';
import { DocumentStatus } from '../documents/entities/document-status.enum';

// New Entities
import { SurveySection } from './entities/survey-section.entity';
import { SurveyOption } from './entities/survey-option.entity';
import { SurveyCondition } from './entities/survey-condition.entity';
import { QuestionType } from './entities/question-type.enum';

@Injectable()
export class SurveysService implements OnModuleInit {
  private readonly logger = new Logger(SurveysService.name);

  constructor(
    @InjectRepository(Question)
    private readonly questionRepository: Repository<Question>,
    @InjectRepository(SurveyResponse)
    private readonly responseRepository: Repository<SurveyResponse>,
    @InjectRepository(Case)
    private readonly caseRepository: Repository<Case>,
    @InjectRepository(Relative)
    private readonly relativeRepository: Repository<Relative>,
    @InjectRepository(SurveySection)
    private readonly sectionRepository: Repository<SurveySection>,
    @InjectRepository(SurveyOption)
    private readonly optionRepository: Repository<SurveyOption>,
    @InjectRepository(SurveyCondition)
    private readonly conditionRepository: Repository<SurveyCondition>,
    @InjectRepository(Document)
    private readonly documentRepository: Repository<Document>,

    private readonly documentsService: DocumentsService,
  ) { }

  private mapInputType(inputType?: string) {
    if (!inputType) return undefined;
    const up = String(inputType).toUpperCase();
    if (up === 'BOOLEAN') return QuestionType.YES_NO;
    if ((Object.values(QuestionType) as string[]).includes(up)) return up as QuestionType;
    return inputType as any;
  }

  async onModuleInit() {
    await this.seedDefaultSurvey();
  }

  async seedDefaultSurvey() {
    const count = await this.sectionRepository.count();
    if (count > 0) return;

    this.logger.log('🌱 Seeding Default Survey Structure...');

    const section1 = await this.sectionRepository.save({
      title: 'Información Personal y Familiar',
      order: 1
    });

    const q1 = await this.questionRepository.save({
      statement: '¿Cuál es su estado civil actual?',
      type: QuestionType.YES_NO,
      order: 1,
      section: section1,
      isActive: true,
      requiredDocumentTypes: []
    });

    await this.createOptionWithCondition(q1, 'Soltero', 1);
    const optCasado = await this.createOptionWithCondition(q1, 'Casado', 2);
    await this.conditionRepository.save({ option: optCasado, requiredDocumentType: 'Registro Civil de Matrimonio' });

    const optUnion = await this.createOptionWithCondition(q1, 'Unión Libre', 3);
    await this.conditionRepository.save({ option: optUnion, requiredDocumentType: 'Declaración Extrajuicio de Convivencia' });

    const q2 = await this.questionRepository.save({
      statement: '¿Tiene hijos?',
      type: QuestionType.YES_NO,
      order: 2,
      section: section1,
      isActive: true,
      requiredDocumentTypes: []
    });

    const optHijosSi = await this.createOptionWithCondition(q2, 'Sí', 1);
    await this.conditionRepository.save({ option: optHijosSi, requiredDocumentType: 'Registro Civil de Nacimiento (Hijos)' });
    await this.createOptionWithCondition(q2, 'No', 2);

    this.logger.log('✅ Survey Seed Completed.');
  }

  private async createOptionWithCondition(question: Question, label: string, order: number) {
    return this.optionRepository.save({
      label,
      order,
      question
    });
  }

  // --- LOGICA DE PROCESAMIENTO DE RESPUESTAS ---

  async submitResponses(caseId: string, dto: CreateBatchResponseDto) {
    if (!Array.isArray(dto.responses)) {
      throw new BadRequestException('El campo responses debe ser un array');
    }

    this.logger.debug(`[submitResponses] Processing ${dto.responses.length} responses for case ${caseId}`);

    const caseEntity = await this.caseRepository.findOne({ where: { id: caseId } });
    if (!caseEntity) throw new NotFoundException('Case not found');

    const currentState = (caseEntity as any).state || (caseEntity as any).status || 'N/A';
    if (currentState !== 'NUEVO' && currentState !== 'EN_PROCESO' && currentState !== 'N/A') {
      this.logger.warn(`[submitResponses] Case state ${currentState} does not allow document creation`);
      return { message: 'Case state does not allow document creation', count: 0 };
    }

    const savedResponses: SurveyResponse[] = [];
    const questionIds = dto.responses.map(r => r.questionId);

    const questions = await this.questionRepository.find({
      where: { id: In(questionIds) },
      relations: ['options', 'options.conditions', 'requiredDocumentTypes']
    });

    this.logger.debug(`[submitResponses] Loaded ${questions.length} questions`);

    for (const responseDto of dto.responses) {
      const question = questions.find(q => q.id === responseDto.questionId);
      if (!question) {
        this.logger.warn(`[submitResponses] Question ${responseDto.questionId} not found`);
        continue;
      }

      // --- 1. PREPARACIÓN DE ENTIDAD RELATIVA ---
      let relativeEntity: Relative | null = null;
      if (responseDto.relativeId) {
        relativeEntity = await this.relativeRepository.findOne({
          where: { id: responseDto.relativeId, case: { id: caseId } }
        });
      }

      // --- 2. GESTIÓN DE LA RESPUESTA (Persistencia) ---
      let response = await this.responseRepository.findOne({
        where: {
          case: { id: caseId },
          question: { id: question.id },
          relative: relativeEntity ? { id: relativeEntity.id } : IsNull()
        }
      });

      if (!response) {
        response = this.responseRepository.create({
          case: caseEntity,
          question: question,
          relative: relativeEntity,
        });
      }

      response.value = String(responseDto.value); 
      await this.responseRepository.save(response);
      savedResponses.push(response);

      this.logger.debug(`[submitResponses] Saved response: Q=${question.id}, Value=${response.value}`);

      // --- 3. LÓGICA DE DISPARADORES (Usando el valor real del DTO) ---
      const rawValue = responseDto.value; // Aquí es true, false o 2 (sin comillas)

      // LOGIC 1: Trigger a nivel de pregunta
      if (question.requiredDocumentTypes?.length > 0) {
        let isTriggered = false;

        if (question.type === QuestionType.YES_NO) {
          // Evaluamos el booleano puro que viene del Front
          if (rawValue === true || String(rawValue).toLowerCase() === 'true') {
            isTriggered = true;
          }
        } else if (String(rawValue).trim() !== '') {
          isTriggered = true;
        }

        if (isTriggered) {
          this.logger.log(`[LOGIC 1] Trigger question-level docs: Q=${question.id}, DocCount=${question.requiredDocumentTypes.length}`);
          for (const docType of question.requiredDocumentTypes) {
            this.logger.log(`[LOGIC 1] Creating document: ${docType.name}`);
            await this.documentsService.createRequiredDocument(caseId, docType.name);
          }
        }
      }

      // LOGIC 2: Trigger a nivel de opción
      const matchedOption = question.options.find(opt => {
        if (opt.id === rawValue) return true;
        
        const label = opt.label?.toLowerCase();
        if ((rawValue === true || String(rawValue) === 'true') && (label === 'sí' || label === 'si')) return true;
        if ((rawValue === false || String(rawValue) === 'false') && label === 'no') return true;
        if (label === String(rawValue).toLowerCase()) return true;
        return false;
      });

      if (matchedOption?.conditions?.length > 0) {
        this.logger.log(`[LOGIC 2] Trigger option-level docs: Q=${question.id}, Option=${matchedOption.id}, CondCount=${matchedOption.conditions.length}`);
        for (const cond of matchedOption.conditions) {
          this.logger.log(`[LOGIC 2] Creating document: ${cond.requiredDocumentType}`);
          await this.documentsService.createRequiredDocument(caseId, cond.requiredDocumentType);
        }
      }
    }

    this.logger.log(`[submitResponses] Completed: ${savedResponses.length} responses saved`);
    return { message: 'Responses processed', count: savedResponses.length };
  }

  /**
   * 🔧 FUNCIÓN MODIFICADA: Ahora es ALTERNATIVA a LOGIC 1 & 2
   * Solo se ejecuta si no hay otra lógica de disparo
   * Genera documentos basados en requiredDocumentTypes de la pregunta
   * 
   * @param caseId - ID del caso
   * @param responses - Array de respuestas del DTO
   * 
   * NOTA: Esta función es un FALLBACK
   * La lógica principal está en submitResponses LOGIC 1 & 2
   */
  private async generateRequiredDocuments(
    caseId: string,
    responses: Array<{ questionId: string; value: any }>
  ): Promise<void> {
    if (!Array.isArray(responses) || responses.length === 0) {
      this.logger.debug(`[generateRequiredDocuments] No responses to process`);
      return;
    }

    this.logger.debug(`[generateRequiredDocuments] Starting for ${responses.length} responses`);

    // Obtener IDs únicos de preguntas
    const questionIds = responses.map(r => r.questionId);
    const uniqueQuestionIds = [...new Set(questionIds)];

    this.logger.debug(`[generateRequiredDocuments] Unique questions: ${uniqueQuestionIds.length}`);

    // Cargar preguntas con documentos requeridos
    const questions = await this.questionRepository.find({
      where: { id: In(uniqueQuestionIds) },
      relations: ['requiredDocumentTypes']
    });

    this.logger.debug(`[generateRequiredDocuments] Loaded ${questions.length} questions from DB`);

    // Mapear respuestas para acceso rápido
    const responseMap = new Map(
      responses.map(r => [r.questionId, r.value])
    );

    // Recolectar documentos a crear: string[] con nombres de documentos
    const documentsToCreate: string[] = [];

    // Procesar cada pregunta
    for (const question of questions) {
      const responseValue = responseMap.get(question.id);
      if (responseValue === undefined) {
        this.logger.debug(`[generateRequiredDocuments] No response for question ${question.id}`);
        continue;
      }

      // Determinar si la respuesta activa la creación de documentos
      let shouldCreateDocs = false;

      if (question.type === QuestionType.YES_NO) {
        // Para preguntas YES_NO, solo si la respuesta es TRUE
        shouldCreateDocs = responseValue === true || String(responseValue).toLowerCase() === 'true';
      } else {
        // Para otras preguntas, si tiene valor no vacío
        shouldCreateDocs = responseValue !== null && 
                          responseValue !== undefined && 
                          String(responseValue).trim() !== '';
      }

      this.logger.debug(`[generateRequiredDocuments] Q=${question.id}, Value=${responseValue}, Triggered=${shouldCreateDocs}, DocCount=${question.requiredDocumentTypes?.length || 0}`);

      if (shouldCreateDocs && question.requiredDocumentTypes?.length > 0) {
        this.logger.log(`[generateRequiredDocuments] Question ${question.id} will generate ${question.requiredDocumentTypes.length} documents`);
        for (const docType of question.requiredDocumentTypes) {
          documentsToCreate.push(docType.name);
          this.logger.log(`[generateRequiredDocuments] Added document type: ${docType.name}`);
        }
      }
    }

    // Eliminar duplicados en array
    const uniqueDocNames = [...new Set(documentsToCreate)];

    if (uniqueDocNames.length === 0) {
      this.logger.warn(`[generateRequiredDocuments] No documents to create (empty list)`);
      return;
    }

    this.logger.log(`[generateRequiredDocuments] Creating ${uniqueDocNames.length} unique documents`);

    // Crear documentos en paralelo
    const results = await Promise.allSettled(
      uniqueDocNames.map(docName => 
        this.createRequiredDocumentIfNotExists(caseId, docName)
      )
    );

    results.forEach((result, idx) => {
      if (result.status === 'fulfilled') {
        this.logger.log(`[generateRequiredDocuments] ✅ Created document: ${uniqueDocNames[idx]}`);
      } else {
        this.logger.error(`[generateRequiredDocuments] ❌ Failed for ${uniqueDocNames[idx]}:`, result.reason);
      }
    });
  }

  /**
   * Crea un documento requerido si aún no existe.
   * Evita duplicados verificando la combinación única (case_id + type).
   * 
   * @param caseId - ID del caso
   * @param documentType - Nombre del tipo de documento
   */
  private async createRequiredDocumentIfNotExists(
    caseId: string,
    documentType: string
  ): Promise<Document | null> {
    try {
      this.logger.debug(`[createRequiredDocumentIfNotExists] Checking: case=${caseId}, type=${documentType}`);

      // Verificar si ya existe documento con mismo case + type
      const existingDoc = await this.documentRepository.findOne({
        where: {
          case: { id: caseId },
          type: documentType
        }
      });

      if (existingDoc) {
        this.logger.warn(`[createRequiredDocumentIfNotExists] Document already exists: id=${existingDoc.id}`);
        return null;
      }

      // Crear nuevo documento con status PENDING
      const newDocument = this.documentRepository.create({
        type: documentType,
        name: documentType,
        status: DocumentStatus.PENDING,
        version: 1
      });

      // Asignar relación DESPUÉS de crear
      newDocument.case = { id: caseId } as any;

      const savedDocument = await this.documentRepository.save(newDocument);
      this.logger.log(`[createRequiredDocumentIfNotExists] ✅ Created: id=${savedDocument.id}, case=${caseId}, type=${documentType}`);
      return savedDocument;
    } catch (error: any) {
      if (error.code === 'ER_DUP_ENTRY' || error.code === '23505' || error.message?.includes('duplicate')) {
        this.logger.warn(`[createRequiredDocumentIfNotExists] Duplicate constraint: case=${caseId}, type=${documentType}`);
        return null;
      }
      this.logger.error(`[createRequiredDocumentIfNotExists] Unexpected error for ${documentType}:`, error.message);
      throw error;
    }
  }

  async findAll() {
    const sections = await this.sectionRepository.find({
      relations: [
        'questions',
        'questions.options',
        'questions.options.conditions',
        'questions.activationOption',
        'questions.section',
        'questions.requiredDocumentTypes'
      ],
      order: {
        order: 'ASC',
        questions: {
          order: 'ASC',
          options: {
            order: 'ASC'
          }
        }
      }
    });

    return sections.map(section => ({
      id: section.id,
      title: section.title,
      description: (section as any).description || null,
      questions: (section.questions || []).map(q => ({
        id: q.id,
        statement: q.statement,
        inputType: q.type === QuestionType.YES_NO ? 'BOOLEAN' : q.type,
        required: !!q.isRequired,
        order: q.order,
        activationOptionId: q.activationOption?.id || null,
        requiredDocumentTypeIds: (q.requiredDocumentTypes || []).map((d: any) => d.id),
        options: (q.options || []).map(o => ({
          id: o.id,
          label: o.label,
          value: (o as any).value || o.label,
          order: o.order,
          requiresDocument: (o.conditions && o.conditions.length > 0) || false
        }))
      }))
    }));
  }

  async createQuestion(createQuestionDto: CreateQuestionDto, surveyId?: string) {
    const { inputType, requiredDocumentTypeIds, ...rest } = createQuestionDto;

    const payload: any = {
      ...rest,
      ...(surveyId && { section: { id: surveyId } }),
      type: this.mapInputType(inputType) || this.mapInputType((rest as any).type),
      requiredDocumentTypes: requiredDocumentTypeIds?.map((id) => ({ id })) || [],
    };

    if (createQuestionDto.activationOptionId !== undefined) {
      payload.activationOption = createQuestionDto.activationOptionId
        ? { id: createQuestionDto.activationOptionId }
        : null;
    }

    const newQuestion = this.questionRepository.create(payload) as unknown as Question;
    const savedQuestion = await this.questionRepository.save(newQuestion);

    if (createQuestionDto.options?.length > 0) {
      for (const [index, optDto] of createQuestionDto.options.entries()) {
        const option = await this.optionRepository.save({
          label: optDto.label,
          order: index + 1,
          question: savedQuestion,
          value: optDto.value
        });

        if (optDto.triggeredDocuments?.length > 0) {
          for (const docType of optDto.triggeredDocuments) {
            await this.conditionRepository.save({ option, requiredDocumentType: docType });
          }
        }
      }
    }
    return this.findOne(savedQuestion.id);
  }

  async createSection(dto: any) {
    const section = this.sectionRepository.create({
      title: dto.title,
      order: dto.order || 1,
      isActive: true,
      description: dto.description
    });
    return this.sectionRepository.save(section);
  }

  findOne(id: string) {
    return this.questionRepository.findOne({ where: { id }, relations: ['options'] });
  }

  async updateQuestion(id: string, updateDto: UpdateQuestionDto) {
    const { options, inputType, requiredDocumentTypeIds, ...rest } = updateDto;

    const payload: any = {
      ...rest,
      id,
      ...(inputType && { type: this.mapInputType(inputType) }),
    };

    if (updateDto.parentQuestionId) payload.parentQuestion = { id: updateDto.parentQuestionId };
    else if (updateDto.parentQuestionId === null) payload.parentQuestion = null;

    if (updateDto.activationOptionId !== undefined) {
      payload.activationOption = updateDto.activationOptionId
        ? { id: updateDto.activationOptionId }
        : null;
    }

    if (requiredDocumentTypeIds) payload.requiredDocumentTypes = requiredDocumentTypeIds.map(id => ({ id }));
    else if (requiredDocumentTypeIds === null) payload.requiredDocumentTypes = [];

    const savedQuestion = await this.questionRepository.save(payload);

    if (options) {
      const currentOptions = await this.optionRepository.find({ where: { question: { id: savedQuestion.id } } });
      const incomingIds = options.filter(o => o.id).map(o => o.id);

      for (const curr of currentOptions) {
        if (!incomingIds.includes(curr.id)) await this.optionRepository.delete(curr.id).catch(() => {});
      }

      for (const optDto of options) {
        let optionEntity = optDto.id ? await this.optionRepository.findOne({ where: { id: optDto.id } }) : null;
        if (optionEntity) Object.assign(optionEntity, optDto);
        else optionEntity = this.optionRepository.create({ ...optDto, question: savedQuestion });

        const savedOpt = await this.optionRepository.save(optionEntity);

        if (optDto.requiredDocumentType !== undefined) {
          await this.conditionRepository.delete({ option: { id: savedOpt.id } });
          if (optDto.requiredDocumentType) {
            await this.conditionRepository.save({ option: savedOpt, requiredDocumentType: optDto.requiredDocumentType });
          }
        }
      }
    }
    return this.findOne(id);
  }

  async deleteQuestion(id: string) {
    await this.questionRepository.delete(id);
    return { deleted: true };
  }

  async updateStructure(surveyId: string, questions: UpdateQuestionDto[]) {
    let targetSection = await this.sectionRepository.findOne({ where: { id: surveyId } });
    if (!targetSection) {
      targetSection = await this.sectionRepository.save({ title: 'Sección General', order: 1, isActive: true });
    }

    return Promise.all(questions.map(async (q, index) => {
      const { inputType, requiredDocumentTypeIds, options, ...rest } = q;
      const payload: any = {
        ...rest,
        section: targetSection,
        order: index + 1,
        type: this.mapInputType(inputType) || this.mapInputType(q.type) || QuestionType.OPEN_TEXT,
        ...(requiredDocumentTypeIds !== undefined && {
          requiredDocumentTypes: requiredDocumentTypeIds.map((id) => ({ id }))
        })
      };

      if (q.parentQuestionId) payload.parentQuestion = { id: q.parentQuestionId };
      else if (q.parentQuestionId === null) payload.parentQuestion = null;

      if (q.activationOptionId !== undefined) {
        payload.activationOption = q.activationOptionId ? { id: q.activationOptionId } : null;
      }

      const savedQuestion = await this.questionRepository.save(payload);

      if (options) {
        const currentOptions = await this.optionRepository.find({ where: { question: { id: savedQuestion.id } } });
        const incomingIds = options.filter(o => o.id).map(o => o.id);

        for (const curr of currentOptions) {
          if (!incomingIds.includes(curr.id)) await this.optionRepository.delete(curr.id).catch(() => {});
        }

        for (const [optIndex, optDto] of options.entries()) {
          const optPayload: any = { ...optDto, order: optIndex + 1, question: savedQuestion };
          const savedOpt = await this.optionRepository.save(optPayload);

          if (optDto.requiredDocumentType !== undefined) {
            await this.conditionRepository.delete({ option: { id: savedOpt.id } });
            if (optDto.requiredDocumentType) {
              await this.conditionRepository.save({ option: savedOpt, requiredDocumentType: optDto.requiredDocumentType });
            }
          }
        }
      }
      return savedQuestion;
    }));
  }

  async evaluateRequirements(answers: any): Promise<string[]> {
    const docs: string[] = [];
    if (!answers) return docs;
    const map = {
      hasId: 'Cédula de Ciudadanía (Ambas caras)',
      hasRut: 'Copia del RUT',
      hasJob: 'Certificado Laboral (< 30 días)',
      hasProperties: 'Certificado de Libertad y Tradición',
      hasVehicle: 'Tarjeta de Propiedad del Vehículo',
      needsPower: 'Poder de Representación Firmado'
    };
    Object.keys(map).forEach(key => { if (answers[key] === 'si') docs.push(map[key]); });
    return docs;
  }
}