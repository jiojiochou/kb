import { Module } from '@nestjs/common';
import { UserService } from './user.service.js';
import { UserController } from './user.controller.js';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity.js';
import { SnowflakeIdModule } from '@street-devs/nest-snowflake-id';

@Module({
  imports: [
    TypeOrmModule.forFeature([User]),
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
  exports: [UserService],
})
export class UserModule {}
