import { Logger, ValidationPipe } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync } from 'fs';
import { join, resolve } from 'path';
//import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  // CANOSYS: código anterior conservado como referencia.
  // const app = await NestFactory.create(AppModule);
  // CANOSYS: utiliza Express para publicar API y frontend desde la Mini PC.
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, validationError: { target: false } }),
  );

  app.enableCors({ origin: true, credentials: false });


  
  app.setGlobalPrefix('api');

  // const config = new DocumentBuilder()
  //   .setTitle('API')
  //   .setDescription('KOKI')
  //   .setVersion('1.0')
  //   .build();

  // const document = SwaggerModule.createDocument(app, config);
  // SwaggerModule.setup('docs', app, document);
  // CANOSYS: código anterior conservado como referencia.
  // await app.listen(AppModule.port);
  // CANOSYS: centraliza puerto, interfaz de red y ubicación del build.
  const configService = app.get(ConfigService);
  const port = configService.get<number>('config.apiconfig.port');
  const host = configService.get<string>('config.apiconfig.host');
  const configuredFrontendPath = configService.get<string>(
    'config.apiconfig.frontendPath',
  );
  const frontendPath = configuredFrontendPath
    ? resolve(configuredFrontendPath)
    : resolve(__dirname, '../../Front/build');
  const frontendIndex = join(frontendPath, 'index.html');

  // CANOSYS: sirve React desde el mismo origen de la API sin impedir el arranque si aún no fue compilado.
  if (existsSync(frontendIndex)) {
    app.useStaticAssets(frontendPath);

    // CANOSYS: permite abrir o recargar rutas internas de React sin interceptar endpoints de la API.
    const expressApp = app.getHttpAdapter().getInstance();
    expressApp.get('*', (request, response, next) => {
      if (request.path.startsWith('/api')) {
        return next();
      }
      return response.sendFile(frontendIndex);
    });
  } else {
    Logger.warn(
      `No se encontró el frontend compilado en ${frontendIndex}.`,
      'Bootstrap',
    );
  }

  // CANOSYS: escucha en la interfaz configurada; 0.0.0.0 permite acceso desde la red local.
  await app.listen(port, host);
}
bootstrap();
