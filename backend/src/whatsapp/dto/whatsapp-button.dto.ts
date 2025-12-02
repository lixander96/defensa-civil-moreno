import { IsString, IsNotEmpty } from 'class-validator';

export class WhatsappButtonDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsString()
  @IsNotEmpty()
  title: string;
}