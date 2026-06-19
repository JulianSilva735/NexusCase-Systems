import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Relative } from './entities/relative.entity';
import { CreateRelativeDto } from './dto/create-relative.dto';

@Injectable()
export class RelativesService {
  constructor(
    @InjectRepository(Relative)
    private readonly relativesRepository: Repository<Relative>,
  ) { }

  async create(createRelativeDto: CreateRelativeDto) {
    const { caseId, ...relativeData } = createRelativeDto;

    const newRelative = this.relativesRepository.create({
      ...relativeData,

      case: { id: caseId }
    });

    return this.relativesRepository.save(newRelative);
  }

  findAll() {
    return this.relativesRepository.find({ relations: ['case'] });
  }

  findOne(id: string) {
    return this.relativesRepository.findOne({
      where: { id },
      relations: ['case']
    });
  }

  async update(id: string, updateRelativeDto: any) {
    const relative = await this.relativesRepository.findOne({ where: { id } });
    if (!relative) {
      throw new NotFoundException(`Familiar con ID ${id} no encontrado.`);
    }

    this.relativesRepository.merge(relative, updateRelativeDto);
    return this.relativesRepository.save(relative);
  }

  async remove(id: string) {
    const relative = await this.relativesRepository.findOne({ where: { id } });
    if (!relative) {
      throw new NotFoundException(`Familiar con ID ${id} no encontrado.`);
    }
    return this.relativesRepository.remove(relative);
  }
}