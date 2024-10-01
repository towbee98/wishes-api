import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { PORT } from './config';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import 'dotenv/config';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {rawBody: true});
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
    }),
  );
  app.enableCors({
    origin: '*',
  });
  const config = new DocumentBuilder()
    .setTitle('Wishpo API Documentation')
    .setDescription('Wishpo API Documentation')
    .setVersion('1.0.0')
    .addTag('wishpo-api')
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);
  await app.listen(PORT);
}
bootstrap();
