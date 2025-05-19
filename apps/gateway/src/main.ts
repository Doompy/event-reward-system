import { NestFactory } from '@nestjs/core';
import { GatewayModule } from './gateway.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe, Logger, LogLevel } from '@nestjs/common';

async function bootstrap() {
  // 모든 로그 레벨 활성화
  const logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  
  const logger = new Logger('Gateway');
  logger.log('Starting Gateway service...');
  
  const app = await NestFactory.create(GatewayModule, {
    logger: logLevels,
  });
  
  // 전역 파이프 설정
  app.useGlobalPipes(new ValidationPipe({
    transform: true,
    whitelist: true,
    forbidNonWhitelisted: true,
  }));

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('Event Reward System API')
    .setDescription('이벤트 보상 시스템 API 문서')
    .setVersion('1.0')
    .addBearerAuth()
    .build();
  
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
  logger.log('Gateway service is listening on port 3000');
}
bootstrap();
