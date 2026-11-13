import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LoginModule } from './login/login.module.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module.js';
import { User } from './user/entities/user.entity.js';
import { AuthModule } from './auth/auth.module.js';
import { UserIdentity } from './user/entities/user-identity.entity.js';
import { RsaModule, RsaService } from '@app/rsa';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    // 自动创建管理数据库表
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'user',
      password: '123456',
      database: 'kb',
      synchronize: true, // 自动根据实体创建表
      logging: true, // 控制台sql日志
      entities: [User, UserIdentity],
      poolSize: 10,
    }),
    RsaModule,
    UserModule,
    LoginModule,
    AuthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements OnApplicationBootstrap {
  constructor(private readonly rsaService: RsaService) {}

  onApplicationBootstrap() {
    this.rsaService.initializeSecretKey();
  }
}
