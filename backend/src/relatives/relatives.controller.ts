import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards } from '@nestjs/common';
import { RelativesService } from './relatives.service';
import { CreateRelativeDto } from './dto/create-relative.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';

@Controller('relatives')
@UseGuards(JwtAuthGuard)
export class RelativesController {
  constructor(private readonly relativesService: RelativesService) {}

  @Post()
  create(@Body() createRelativeDto: CreateRelativeDto) {
    return this.relativesService.create(createRelativeDto);
  }

  @Get()
  findAll() {
    return this.relativesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.relativesService.findOne(id);
  }
}