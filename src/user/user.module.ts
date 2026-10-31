import { Module } from '@nestjs/common';
import { UserService } from './user.service';
import { UserController } from './user.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { User } from './entities/user.entity';
import { SnowflakeIdModule } from '@street-devs/nest-snowflake-id';
import { UserIdentity } from './entities/user-identity.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, UserIdentity]),
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
