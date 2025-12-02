import {
  Body,
  Controller,
  DefaultValuePipe,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { WhatsappService, WhatsappStatusPayload } from './whatsapp.service';
import { JwtAuthGuard } from 'src/modules/auth/guards/jwt-auth.guard';
import { AdminGuard } from 'src/modules/auth/guards/admin.guard';
import { SendChatMessageDto } from './dto/send-chat-message.dto';
import {
  WhatsappConversationSummary,
  WhatsappMessagePayload,
  WhatsappMessagesResponse,
} from './whatsapp.types';
import { ApiBearerAuth } from '@nestjs/swagger';

@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
@Controller('whatsapp')
export class WhatsappController {
  constructor(private readonly whatsappService: WhatsappService) {}

  @Get('status')
  getStatus(): WhatsappStatusPayload {
    return this.whatsappService.getStatus();
  }

  @Post('connect')
  @HttpCode(HttpStatus.ACCEPTED)
  async connect(): Promise<WhatsappStatusPayload> {
    await this.whatsappService.connect();
    return this.whatsappService.getStatus();
  }

  @Post('logout')
  @HttpCode(HttpStatus.ACCEPTED)
  async logout(): Promise<WhatsappStatusPayload> {
    await this.whatsappService.logout();
    return this.whatsappService.getStatus();
  }

  @Get('chats')
  async listChats(): Promise<WhatsappConversationSummary[]> {
    return this.whatsappService.listChats();
  }

  @Get('chats/:chatId')
  async getChat(@Param('chatId') chatId: string): Promise<WhatsappConversationSummary> {
    return this.whatsappService.getChat(chatId);
  }

  @Get('chats/:chatId/messages')
  async getChatMessages(
    @Param('chatId') chatId: string,
    @Query('limit', new DefaultValuePipe(100), ParseIntPipe) limit: number,
  ): Promise<WhatsappMessagesResponse> {
    return this.whatsappService.getChatMessages(chatId, limit);
  }

  @Post('chats/:chatId/messages')
  @HttpCode(HttpStatus.CREATED)
  async sendChatMessage(
    @Param('chatId') chatId: string,
    @Body() dto: SendChatMessageDto,
  ): Promise<WhatsappMessagePayload> {
    return this.whatsappService.sendChatMessage(chatId, dto.message);
  }

  @Post('chats/:chatId/read')
  @HttpCode(HttpStatus.NO_CONTENT)
  async markChatAsRead(@Param('chatId') chatId: string): Promise<void> {
    await this.whatsappService.markChatAsRead(chatId);
  }
}
