import { NestFactory } from '@nestjs/core';
import { ValidationPipe, Logger } from '@nestjs/common';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import helmet from 'helmet';

async function bootstrap() {
  const isProduction = process.env.NODE_ENV === 'production';

  const app = await NestFactory.create(AppModule, {
    logger: isProduction
      ? ['error', 'warn', 'log']
      : ['error', 'warn', 'log', 'debug', 'verbose'],
  });

  const logger = new Logger('NexusCase');

  // 🔐 Seguridad básica
  app.use(helmet());

  // 🌐 CORS configurable
  const allowedOrigins = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : ['http://localhost:5173', 'http://localhost:3000'];

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
  });

  // 🌍 Prefijo global
  app.setGlobalPrefix('api');

  // ✅ Validación global
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true, // 🔥 importante
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // 📄 Swagger (ANTES de levantar el server)
  const config = new DocumentBuilder()
    .setTitle('NexusCase API')
    .setDescription('API para gestión de casos')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  logger.log(`🚀 NexusCase API running on: http://localhost:${port}/api`);
  logger.log(`📄 Swagger docs: http://localhost:${port}/docs`);
}

bootstrap();