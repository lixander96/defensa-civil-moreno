import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import { join } from 'path';
import * as express from 'express';

async function bootstrap() {
  const app = await NestFactory.create(AppModule,
    {
      cors: true,
      httpsOptions: AppModule.ssl_certificate_path && AppModule.ssl_key_path ? {
        cert: readFileSync(AppModule.ssl_certificate_path),
        key: readFileSync(AppModule.ssl_key_path),
      } : undefined,
    }
  );

  app.setGlobalPrefix('api');

  // Validaciones
  app.useGlobalPipes(new ValidationPipe());

  // Doc
  const config = new DocumentBuilder()
    .setTitle('API de Reclamos para Defensa Civil del Municipio de Moreno')
    .setDescription('Esta API proporciona funcionalidades para la gestión de reclamos relacionados con la defensa civil en el municipio de Moreno. Permite a los ciudadanos presentar reclamos por incidentes relacionados con desastres naturales, daños a la propiedad, problemas de infraestructura y otras emergencias civiles. Además, facilita a los administradores municipales la revisión, aprobación y gestión de estos reclamos.')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('auth')
    .addTag('users')
    .addTag('complaints')
    .addTag('areas')
    .addTag('complaint-types')
    .addTag('complaints')
    .build();
  const document = SwaggerModule.createDocument(app, config);

  SwaggerModule.setup('api/documentation', app, document);

  // Servir estáticos del frontend (sin index automático)
  app.use(express.static(join(__dirname, '..', 'static'), { index: false }));

  // ⬇️ Usar el servidor Express subyacente para el fallback
  const server = app.getHttpAdapter().getInstance(); // Express app

  server.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();      // deja pasar a controladores + Swagger
    if (req.method !== 'GET') return next();
    if (!req.accepts('html')) return next();

    return res.sendFile(join(__dirname, '..', 'static', 'index.html'));
  });

  await app.listen(AppModule.port);
}

bootstrap();
