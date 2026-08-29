import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true, // 剔除客户端DTO里未声明的参数
      transform: true, // 自动转换参数的类型,根据DTO里ts的类型标注和装饰器里type指定的类型
      forbidNonWhitelisted: true, // 客户端传入未在DTO里声明的参数抛出异常
    }),
  );
  await app.listen(process.env.PORT ?? 3000);
}
void bootstrap();
