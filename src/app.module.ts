import { Module, OnApplicationBootstrap } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoginModule } from './login/login.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserModule } from './user/user.module';
import { User } from './user/entities/user.entity';
import { AuthModule } from './auth/auth.module';
import { RsaService } from './auth/rsa.service';
import { UserIdentity } from './user/entities/user-identity.entity';

@Module({
  imports: [
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
    LoginModule,
    UserModule,
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
