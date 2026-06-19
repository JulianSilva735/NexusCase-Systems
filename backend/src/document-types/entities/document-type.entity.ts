import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('document_types')
export class DocumentType {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: false })
  isMandatory: boolean;

  @Column({ default: true })
  isActive: boolean;

  @Column('simple-array', { nullable: true })
  allowedFormats: string[];

  @Column({ nullable: true })
  templateUrl: string;
}