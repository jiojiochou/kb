import { PartialType } from '@nestjs/mapped-types';
import { CreateMqDto } from './create-mq.dto';

export class UpdateMqDto extends PartialType(CreateMqDto) {}
