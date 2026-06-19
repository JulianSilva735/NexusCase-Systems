import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- 1. Importar esto
import { RelativesService } from './relatives.service';
import { RelativesController } from './relatives.controller';
import { Relative } from './entities/relative.entity'; // <--- 2. Importar la entidad

@Module({
  imports: [
    TypeOrmModule.forFeature([Relative]) // <--- 3. ¡REGISTRAR LA ENTIDAD AQUÍ!
  ],
  controllers: [RelativesController],
  providers: [RelativesService],
  exports: [RelativesService]
})
export class RelativesModule { }