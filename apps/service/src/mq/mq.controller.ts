import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { MqService } from './mq.service';
import { CreateMqDto } from './dto/create-mq.dto';
import { UpdateMqDto } from './dto/update-mq.dto';

@Controller('mq')
export class MqController {
  constructor(private readonly mqService: MqService) {}

  @Post()
  create(@Body() createMqDto: CreateMqDto) {
    return this.mqService.create(createMqDto);
  }

  @Get()
  findAll() {
    return this.mqService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.mqService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateMqDto: UpdateMqDto) {
    return this.mqService.update(+id, updateMqDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.mqService.remove(+id);
  }
}
