import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug']
  });

  const config = new DocumentBuilder()
    .setTitle('Orchestrateur API')
    .setDescription('Développé par Nathan Lamy')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        in: 'header',
      },
      'jwt',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-orchestrateur', app, document);

  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Authorization',
    credentials: true,
  });

  const port = process.env.PORT ?? 3000;
  await app.listen(port);

  Logger.log(`Application démarrée sur le port ${port}: http://localhost:${port}`, 'Bootstrap');
  Logger.log(`Swagger UI disponible à : http://localhost:${port}/api-orchestrateur`, 'Bootstrap');
}
bootstrap().catch((error) => {
  console.error('Erreur pendant le bootstrap :', error);
});
