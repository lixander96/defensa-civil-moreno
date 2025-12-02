import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsappService } from './whatsapp.service';
import { WhatsappController } from './whatsapp.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { WhatsappChatEntity } from './entities/whatsapp-chat.entity';
import { WhatsappMessageEntity } from './entities/whatsapp-message.entity';

@Module({
  imports: [ConfigModule, TypeOrmModule.forFeature([WhatsappChatEntity, WhatsappMessageEntity])],
  controllers: [WhatsappController],
  providers: [WhatsappService],
  exports: [WhatsappService],
})
export class WhatsappModule { }
