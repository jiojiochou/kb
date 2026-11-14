import {
  IsEmail,
  IsOptional,
  IsString,
  IsUrl,
  Length,
  MaxLength,
  ValidateIf,
} from 'class-validator';
import { Trim } from '@app/decorators';

export class UpdateUserDto {
  @ValidateIf((_object, value: unknown) => value !== undefined)
  @IsEmail()
  @Length(1, 100)
  @Trim()
  email?: string;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Trim()
  displayName?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Trim()
  firstName?: string | null;

  @IsOptional()
  @IsString()
  @Length(1, 50)
  @Trim()
  lastName?: string | null;

  @IsOptional()
  @IsUrl()
  @MaxLength(2048)
  avatar?: string | null;
}
