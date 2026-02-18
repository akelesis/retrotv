import 'reflect-metadata';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  try {
    const config = new DocumentBuilder()
      .setTitle('RetroTV API')
      .setDescription('API para RetroTV - MVP')
      .setVersion('0.1.0')
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document);
  } catch (err: any) {
    console.warn('Swagger setup failed, continuing without docs:', err?.message || err);
  }

  // CORS configuration
  // Set `CORS_ORIGIN` in your .env to a single origin or comma-separated origins
  // e.g. CORS_ORIGIN=http://localhost:3000,https://app.example.com
  const corsEnv = process.env.CORS_ORIGIN || '*';
  const origins = corsEnv.split(',').map((s) => s.trim());

  app.enableCors({
    origin: origins.includes('*') ? true : origins,
    credentials: true,
    allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
  });

  const port = process.env.PORT || 3000;
  await app.listen(port as any, '0.0.0.0');
  console.log(`Listening on http://0.0.0.0:${port}`);
}

bootstrap();
