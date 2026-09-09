import { Module } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';
import { MqController } from './mq.controller';

@Module({
  controllers: [MqController],
  providers: [RabbitMQService],
})
export class MqModule {}
