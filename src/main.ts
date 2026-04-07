import { NestFactory } from '@nestjs/core';
import { ValidationPipe, VersioningType } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from '@shared/presentation/filters/http-exception.filter';
import { PrismaExceptionFilter } from '@shared/presentation/filters/prisma-exception.filter';
import { ResponseTransformInterceptor } from '@shared/presentation/interceptors/response-transform.interceptor';
import { LoggingInterceptor } from '@shared/presentation/interceptors/logging.interceptor';
import { AppLoggerService } from '@infrastructure/logging/logger.service';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });

  const logger = app.get(AppLoggerService);
  app.useLogger(logger);

  const config = app.get(ConfigService);
  const port = config.get<number>('port', 3000);
  const nodeEnv = config.get<string>('nodeEnv', 'development');

  // Global prefix and versioning
  app.setGlobalPrefix('api');
  app.enableVersioning({ type: VersioningType.URI });

  // CORS
  app.enableCors({
    origin: nodeEnv === 'production' ? config.get<string>('CORS_ORIGIN') : true,
    credentials: true,
  });

  // Global pipes
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Global filters
  app.useGlobalFilters(new PrismaExceptionFilter(), new HttpExceptionFilter());

  // Global interceptors
  app.useGlobalInterceptors(new LoggingInterceptor(), new ResponseTransformInterceptor());

  // Swagger
  if (nodeEnv !== 'production') {
    const swaggerConfig = new DocumentBuilder()
      .setTitle('Backend ERP API')
      .setDescription('Enterprise ERP for field operations management')
      .setVersion('1.0')
      .addBearerAuth()
      .addServer(`http://localhost:${port}`, 'Local')
      .build();

    const document = SwaggerModule.createDocument(app, swaggerConfig);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: { persistAuthorization: true },
    });
  }

  await app.listen(port);
  logger.log(`Application running on port ${port} [${nodeEnv}]`, 'Bootstrap');
  logger.log(`Swagger available at http://localhost:${port}/api/docs`, 'Bootstrap');
}

bootstrap();
