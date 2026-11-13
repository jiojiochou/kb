import { IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsNotEmpty()
  @IsString()
  // @MinLength(5)
  account: string;

  @IsNotEmpty()
  // @MinLength(5)
  password: string;
}
