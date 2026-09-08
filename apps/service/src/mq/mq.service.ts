import { Injectable } from '@nestjs/common';
import { CreateMqDto } from './dto/create-mq.dto';
import { UpdateMqDto } from './dto/update-mq.dto';

@Injectable()
export class MqService {
  create(createMqDto: CreateMqDto) {
    return 'This action adds a new mq';
  }

  findAll() {
    return `This action returns all mq`;
  }

  findOne(id: number) {
    return `This action returns a #${id} mq`;
  }

  update(id: number, updateMqDto: UpdateMqDto) {
    return `This action updates a #${id} mq`;
  }

  remove(id: number) {
    return `This action removes a #${id} mq`;
  }
}
