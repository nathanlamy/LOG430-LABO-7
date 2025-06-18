import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    logger: ['log', 'error', 'warn', 'debug']
  });

  const config = new DocumentBuilder()
    .setTitle('Magasin API')
    .setDescription('Developped by Nathan Lamy')
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
  SwaggerModule.setup('api-magasin', app, document);

  app.enableCors({
    origin: '*', // Permettre toutes les origines
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE', // Méthodes autorisées
    allowedHeaders: 'Content-Type, Authorization', // En-têtes autorisés
    credentials: true, // Autoriser les cookies et les en-têtes d'autorisation
  });

  await app.listen(3000);
  Logger.log('Application démarrée sur le port 3000: http://localhost:3000', 'Bootstrap');
}
bootstrap()
  .then(() => {
    Logger.log('Application is running on: http://localhost:3000', 'Bootstrap');
    Logger.log(
      'Swagger UI is available at: http://localhost:3000/api-magasin',
      'Bootstrap',
    );
  })
  .catch((error) => {
    console.error('Error during application bootstrap:', error);
  });
