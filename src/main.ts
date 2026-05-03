import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { join } from 'path';
import { mkdirSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const corsOrigin = (process.env.CORS_ORIGIN ?? '*').trim();
  const allowedOrigins = corsOrigin
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  app.enableCors({
    origin:
      allowedOrigins.length === 0 || allowedOrigins.includes('*')
        ? true
        : allowedOrigins,
  });

  const uploadsDir = join(process.cwd(), 'uploads');
  mkdirSync(uploadsDir, { recursive: true });
  app.useStaticAssets(uploadsDir, { prefix: '/uploads/' });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new HttpExceptionFilter());
  app.useGlobalInterceptors(new TransformInterceptor());

  const swaggerTitle = process.env.SWAGGER_TITLE;
  const swaggerDescription = process.env.SWAGGER_DESCRIPTION;
  const swaggerVersion = process.env.SWAGGER_VERSION;

  if (!swaggerTitle || !swaggerDescription || !swaggerVersion) {
    throw new Error('SWAGGER_TITLE, SWAGGER_DESCRIPTION, and SWAGGER_VERSION are required');
  }

  const swaggerConfig = new DocumentBuilder()
    .setTitle(swaggerTitle)
    .setDescription(swaggerDescription)
    .setVersion(swaggerVersion)
    .addBearerAuth()
    .build();
  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument);

  const port = Number(process.env.APP_PORT ?? process.env.PORT);
  if (!port) {
    throw new Error('APP_PORT or PORT is required');
  }

  await app.listen(port);
}

bootstrap();
