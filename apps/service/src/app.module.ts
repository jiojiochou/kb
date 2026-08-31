import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { DocumentModule } from './document/document.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DocumentEntity } from './document/entities/document.entity';
import { MongooseModule } from '@nestjs/mongoose';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return {
          type: 'postgres',
          host: config.get<string>('POSTGRES_HOST', 'localhost'),
          port: config.get<number>('POSTGRES_PORT', 5432),
          username: config.get<string>('POSTGRES_USER', 'user'),
          password: config.get<string>('POSTGRES_PASSWORD', '123456'),
          database: config.get<string>('POSTGRES_DB', 'knowledge_base'),
          entities: [DocumentEntity],
          synchronize: false,
        };
      },
    }),
    MongooseModule.forRootAsync({
      inject: [ConfigService],
      useFactory(config: ConfigService) {
        return {
          uri: config.get<string>(
            'MONGO_URI',
            'mongodb://mongo_user:mongo_pass123@localhost:27017/knowledge_base?authSource=admin',
          ),
        };
      },
    }),
    DocumentModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
