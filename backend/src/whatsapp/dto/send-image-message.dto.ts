import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class SendImageMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'El número debe contener solo dígitos' })
  to: string;

  @IsString()
  @IsNotEmpty()
  imageName: string; // nombre del archivo con extensión, ej: "foto123.png"

  @IsString()
  caption?: string;
}
