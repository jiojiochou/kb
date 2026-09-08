import { Module } from '@nestjs/common';
import { MqService } from './mq.service';
import { MqController } from './mq.controller';

@Module({
  controllers: [MqController],
  providers: [MqService],
})
export class MqModule {}
