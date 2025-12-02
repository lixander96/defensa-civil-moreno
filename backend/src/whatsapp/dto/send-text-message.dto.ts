import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SendTextMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'El número debe contener solo dígitos' })
  to: string;

  @IsString()
  @IsNotEmpty()
  message: string;
}