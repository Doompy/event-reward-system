import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth.module';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { Logger, LogLevel } from '@nestjs/common';

async function bootstrap() {
  // 모든 로그 레벨 활성화
  const logLevels: LogLevel[] = ['log', 'error', 'warn', 'debug', 'verbose'];
  
  const logger = new Logger('Auth');
  logger.log('Starting Auth microservice...');
  
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AuthModule,
    {
      transport: Transport.TCP,
      options: {
        host: '0.0.0.0',
        port: 3001,
      },
      logger: logLevels,
    },
  );
  
  // 명시적으로 로거 설정
  app.useLogger(logger);
  await app.listen();
  logger.log('Auth microservice is listening on port 3001');
}
bootstrap();
