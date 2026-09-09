import { Controller } from '@nestjs/common';
import { RabbitMQService } from './rabbitmq.service';

@Controller('mq')
export class MqController {
  constructor(private readonly mqService: RabbitMQService) {}
}
