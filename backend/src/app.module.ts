import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';

import { UsersModule } from './users/users.module';
import { AuthModule } from './auth/auth.module';
import { CasesModule } from './cases/cases.module';
import { RelativesModule } from './relatives/relatives.module';
import { DocumentsModule } from './documents/documents.module';
import { SurveysModule } from './surveys/surveys.module';
import { DocumentTypesModule } from './document-types/document-types.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    ServeStaticModule.forRoot({
      rootPath: join(process.cwd(), 'uploads'),
      serveRoot: '/uploads',
      serveStaticOptions: { index: false },
    }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const dbUrl = configService.get<string>('DATABASE_URL')?.trim();
        const isPlaceholderDbUrl =
          !dbUrl ||
          dbUrl.includes('postgresql://user:password@host') ||
          dbUrl.includes('postgres://user:password@host');

        if (isPlaceholderDbUrl) {
          return {
            type: 'sqlite',
            database: join(process.cwd(), 'dev.sqlite'),
            autoLoadEntities: true,
            synchronize: configService.get<string>('NODE_ENV') !== 'production',
          };
        }

        return {
          type: 'postgres',
          url: dbUrl,
          autoLoadEntities: true,
          synchronize: configService.get<string>('NODE_ENV') !== 'production',
          ssl:
            configService.get<string>('DB_SSL') === 'true'
              ? { rejectUnauthorized: false }
              : false,
        };
      },
    }),

    UsersModule,
    AuthModule,
    CasesModule,
    RelativesModule,
    DocumentsModule,
    SurveysModule,
    DocumentTypesModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
