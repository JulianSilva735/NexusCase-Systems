import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm'; // <--- Importar
import { DocumentTypesService } from './document-types.service';
import { DocumentTypesController } from './document-types.controller';
import { DocumentType } from './entities/document-type.entity'; // <--- Importar

@Module({
  imports: [TypeOrmModule.forFeature([DocumentType])], // <--- Registrar
  controllers: [DocumentTypesController],
  providers: [DocumentTypesService],
  exports: [TypeOrmModule] // Exportarlo por si lo necesitamos luego
})
export class DocumentTypesModule {}