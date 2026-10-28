import { IsEmail, IsString, Length, MinLength } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @Length(1, 50)
  account: string;

  @IsString()
  @MinLength(6)
  password: string;

  @IsEmail()
  @Length(1, 100)
  email: string;

  @IsString()
  @Length(1, 50)
  name: string;
}
