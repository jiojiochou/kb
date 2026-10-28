import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SnowflakeIdModule } from '@street-devs/nest-snowflake-id';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]), // 引入User实体
    SnowflakeIdModule.forRoot({
      customEpoch: 1609459200000,
      machineId: {
        dataCenterId: 1,
        workerId: 1,
      },
    }),
  ],
  controllers: [UserController],
  providers: [UserService],
})
export class UserModule {}
