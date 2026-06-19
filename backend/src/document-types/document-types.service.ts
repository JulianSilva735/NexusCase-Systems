import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateDocumentTypeDto } from './dto/create-document-type.dto';
import { UpdateDocumentTypeDto } from './dto/update-document-type.dto';
import { DocumentType } from './entities/document-type.entity';

@Injectable()
export class DocumentTypesService {
  constructor(
    @InjectRepository(DocumentType)
    private repo: Repository<DocumentType>,
  ) { }

  create(createDto: CreateDocumentTypeDto) {
    const newDoc = this.repo.create(createDto);
    return this.repo.save(newDoc);
  }

  findAll() {
    return this.repo.find();
  }

  async findOne(id: number) {
    const doc = await this.repo.findOneBy({ id });
    if (!doc) throw new NotFoundException(`DocumentType #${id} not found`);
    return doc;
  }

  async update(id: number, updateDto: UpdateDocumentTypeDto) {
    // Usamos preload para fusionar el ID con los datos del DTO
    const doc = await this.repo.preload({
      id: id,
      ...updateDto,
    });

    if (!doc) {
      throw new NotFoundException(`DocumentType #${id} not found`);
    }

    return this.repo.save(doc);
  }

  async remove(id: number) {
    const doc = await this.findOne(id);
    return this.repo.remove(doc);
  }
}