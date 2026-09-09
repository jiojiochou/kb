import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import amqp, { AmqpConnectionManager } from 'amqp-connection-manager';
import { ConfirmChannel } from 'amqplib';

@Injectable()
export class RabbitMQService implements OnModuleInit {
  private connection: AmqpConnectionManager | null = null;

  constructor(private readonly config: ConfigService) {}
  /* 
    初始化MQ 创建连接 创建频道
    */
  onModuleInit() {
    const url = this.config.get<string>('RABBITMQ_URL')!;

    this.connection = amqp.connect([url]);

    this.connection.createChannel({
      json: true,
      async setup(ch: ConfirmChannel) {},
    });
  }
}
