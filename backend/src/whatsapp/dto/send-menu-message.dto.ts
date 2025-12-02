import { IsString, IsNotEmpty, Matches, ValidateNested, ArrayMaxSize, ArrayMinSize } from 'class-validator';
import { Type } from 'class-transformer';
import { WhatsappButtonDto } from './whatsapp-button.dto';

export class SendMenuMessageDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d+$/, { message: 'El número debe contener solo dígitos' })
  to: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @ValidateNested({ each: true })
  @Type(() => WhatsappButtonDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(3) // WhatsApp permite hasta 3 botones por mensaje interactivo
  buttons: WhatsappButtonDto[];
}
