import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleDestroy,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Chat,
  Client,
  LocalAuth,
  Message,
  MessageMedia,
  MessageSearchOptions,
} from 'whatsapp-web.js';
import * as qrcode from 'qrcode';
import { join } from 'path';
import { existsSync } from 'fs';
import { SendTextMessageDto } from './dto/send-text-message.dto';
import { SendMenuMessageDto } from './dto/send-menu-message.dto';
import { SendImageMessageDto } from './dto/send-image-message.dto';
import { EnvironmentVariables } from 'src/config/config.configuration';
import {
  WhatsappConversationSummary,
  WhatsappMessagePayload,
  WhatsappMessagesResponse,
} from './whatsapp.types';
import { InjectRepository } from '@nestjs/typeorm';
import { WhatsappChatEntity } from './entities/whatsapp-chat.entity';
import { Repository } from 'typeorm';
import { WhatsappMessageEntity } from './entities/whatsapp-message.entity';

export type WhatsappConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'qr'
  | 'authenticated'
  | 'connected'
  | 'disconnected'
  | 'failed';

export interface WhatsappStatusPayload {
  status: WhatsappConnectionStatus;
  number?: string | null;
  pushName?: string | null;
  qr?: {
    dataUrl: string;
    generatedAt: string;
  } | null;
}

@Injectable()
export class WhatsappService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(WhatsappService.name);
  private client: Client;
  private status: WhatsappConnectionStatus = 'idle';
  private qrDataUrl: string | null = null;
  private qrGeneratedAt: Date | null = null;
  private isReady = false;
  private isInitializing = false;
  private number: string | null = null;
  private pushName: string | null = null;
  private qrGenerationToken = 0;
  private readonly sessionPath: string;
  private static readonly SUPPORTED_CHAT_SERVERS = new Set(['c.us', 's.whatsapp.net']);
  private static readonly MEDIA_CACHE_LIMIT = 200;
  private readonly mediaCache = new Map<string, WhatsappMessagePayload['media']>();

  constructor(
    private readonly configService: ConfigService<EnvironmentVariables>,
    @InjectRepository(WhatsappChatEntity)
    private readonly chatRepo: Repository<WhatsappChatEntity>,
    @InjectRepository(WhatsappMessageEntity)
    private readonly messageRepo: Repository<WhatsappMessageEntity>,
  ) {
    this.sessionPath =
      this.configService.get<string>('WHATSAPP_SESSION_PATH') ||
      join(process.cwd(), '.wwebjs_auth');
    this.client = this.createClient();
  }

  onModuleInit(): void {
    this.initializeClient();
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.client.destroy();
    } catch (error) {
      this.logger.error('Error while destroying WhatsApp client', error as Error);
    }
  }

  getStatus(): WhatsappStatusPayload {
    return {
      status: this.status,
      number: this.number,
      pushName: this.pushName,
      qr:
        this.qrDataUrl && this.qrGeneratedAt
          ? {
            dataUrl: this.qrDataUrl,
            generatedAt: this.qrGeneratedAt.toISOString(),
          }
          : null,
    };
  }

  async connect(): Promise<void> {
    if (this.isInitializing || this.status === 'connected') {
      return;
    }

    if (this.client) {
      try {
        await this.client.getState();
        this.logger.debug('WhatsApp client already initialized');
        return;
      } catch {
        this.logger.debug('WhatsApp client not ready, reinitializing');
      }
    }

    this.initializeClient(true);
  }

  async logout(): Promise<void> {
    if (!this.client) {
      return;
    }

    try {
      await this.client.logout();
    } catch (error) {
      this.logger.error('Error during WhatsApp logout', error as Error);
    }

    await this.recreateClient();
    this.initializeClient();
  }

  async listChats(): Promise<WhatsappConversationSummary[]> {
    // Si es la primera vez y no hay chats en DB, traemos todo desde WhatsApp
    const totalChats = await this.chatRepo.count();
    if (totalChats === 0 && this.isReady) {
      await this.syncAllChatsFromWhatsapp();
    }

    const chats = await this.chatRepo.find({
      order: { updatedAt: 'DESC' },
    });

    return Promise.all(
      chats.map(async (chat) => {
        const lastMessage = await this.messageRepo.findOne({
          where: { chatId: chat.id },
          order: { timestamp: 'DESC' },
        });

        return {
          id: chat.id,
          displayName: chat.displayName,
          number: chat.number,
          isGroup: chat.isGroup,
          unreadCount: chat.unreadCount,
          archived: chat.archived,
          muted: chat.muted,
          // ⚠️ IMPORTANTE: permitir que sea null u opcional
          lastMessage: lastMessage ? this.mapMessageEntityToPayload(lastMessage) : null,
          updatedAt: chat.updatedAt ? chat.updatedAt.toISOString() : null,
        };
      }),
    );
  }

  async getChat(chatId: string): Promise<WhatsappConversationSummary> {
    await this.ensureClientReady();
    const resolvedId = this.resolveChatId(chatId);

    try {
      const chat = await this.client.getChatById(resolvedId);
      return this.mapChatSummary(chat);
    } catch (error) {
      this.logger.warn(`WhatsApp chat not found: ${chatId}`, error as Error);
      throw new NotFoundException('La conversación solicitada no existe');
    }
  }

  async getChatMessages(chatId: string, limit = 50): Promise<WhatsappMessagesResponse> {
    const resolvedId = this.resolveChatId(chatId);

    let chat = await this.chatRepo.findOne({ where: { id: resolvedId } });

    if (!chat && this.isReady) {
      await this.backfillChatHistoryForLastMonths(resolvedId, 6);
      chat = await this.chatRepo.findOne({ where: { id: resolvedId } });
    }

    if (!chat) {
      throw new NotFoundException('La conversación solicitada no existe');
    }

    const normalizedLimit = Math.max(1, Math.min(limit, 500));

    const currentCount = await this.messageRepo.count({ where: { chatId: resolvedId } });

    if (currentCount === 0 && this.isReady) {
      await this.backfillChatHistoryForLastMonths(resolvedId, 6);
    }

    // 1) Traés desde la DB en DESC (más nuevo → más viejo)
    const messages = await this.messageRepo.find({
      where: { chatId: resolvedId },
      order: { timestamp: 'DESC' },
      take: normalizedLimit,
    });

    // 2) Mapear a payload
    const mappedMessages = messages
      .map((m) => this.mapMessageEntityToPayload(m))
      // 3) Reordenar por fecha completa ASC (más viejo → más nuevo)
      .sort(
        (a, b) =>
          new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
      );

    const hasMore = messages.length === normalizedLimit;

    // Si no estás usando paginación todavía, esto casi ni importa,
    // pero lo dejo coherente: el "cursor" será el más viejo de este lote
    const nextCursor =
      hasMore && mappedMessages.length > 0 ? mappedMessages[0].id : null;

    const lastMessage = mappedMessages.length
      ? mappedMessages[mappedMessages.length - 1]
      : null;

    const chatSummary: WhatsappConversationSummary = {
      id: chat.id,
      displayName: chat.displayName,
      number: chat.number,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount,
      archived: chat.archived,
      muted: chat.muted,
      lastMessage,
      updatedAt: chat.updatedAt ? chat.updatedAt.toISOString() : null,
    };

    return {
      chat: chatSummary,
      messages: mappedMessages,
      nextCursor,
      hasMore,
    };
  }

  private mapMessageEntityToPayload(entity: WhatsappMessageEntity): WhatsappMessagePayload {
    return {
      id: entity.id,
      chatId: entity.chatId,
      body: entity.body,
      fromMe: entity.fromMe,
      senderId: entity.senderId,
      senderName: entity.senderName,
      timestamp: entity.timestamp.toISOString(),
      type: entity.type,
      hasMedia: entity.hasMedia,
      ack: entity.ack,
      media: entity.mediaMimeType
        ? {
          mimetype: entity.mediaMimeType,
          data: entity.mediaDataBase64 ?? '',
          fileName: entity.mediaFileName,
          fileSize: entity.mediaFileSize,
          durationSeconds: entity.mediaDurationSeconds,
        }
        : null,
    };
  }

  async sendChatMessage(chatId: string, message: string): Promise<WhatsappMessagePayload> {
    await this.ensureClientReady();
    const resolvedId = this.resolveChatId(chatId);
    const trimmed = message.trim();

    if (!trimmed) {
      throw new BadRequestException('El mensaje no puede estar vacío');
    }

    try {
      const sentMessage = await this.client.sendMessage(resolvedId, trimmed);
      const payload = await this.mapMessagePayload(sentMessage, resolvedId);

      // Persistir en DB
      await this.persistMessageFromWhatsapp(sentMessage, resolvedId);
      await this.upsertChatFromWhatsapp(await sentMessage.getChat());

      return payload;
    } catch (error) {
      this.logger.error('Failed to send WhatsApp message', error as Error);
      throw new BadRequestException('No fue posible enviar el mensaje');
    }
  }

  async markChatAsRead(chatId: string): Promise<void> {
    await this.ensureClientReady();
    const resolvedId = this.resolveChatId(chatId);

    try {
      const chat = await this.client.getChatById(resolvedId);
      await chat.sendSeen();
    } catch (error) {
      this.logger.warn(
        `Unable to mark WhatsApp chat as read: ${chatId}`,
        error as Error,
      );
      throw new NotFoundException('No se pudo marcar la conversación como leída');
    }
  }

  async sendTextMessage(dto: SendTextMessageDto): Promise<void> {
    await this.ensureClientReady();
    const chatId = this.resolveChatId(dto.to);
    await this.client.sendMessage(chatId, dto.message);
  }

  async sendMenuMessage(dto: SendMenuMessageDto): Promise<void> {
    await this.ensureClientReady();
    const chatId = this.resolveChatId(dto.to);
    const textMessage = `${dto.message}\n\n${dto.buttons
      .map((button, index) => `${index + 1}. ${button.title}`)
      .join('\n')}`;
    await this.client.sendMessage(chatId, textMessage);
  }

  async sendImageMessage(dto: SendImageMessageDto): Promise<void> {
    await this.ensureClientReady();
    const chatId = this.resolveChatId(dto.to);
    const mediaPath = join(process.cwd(), 'upload', dto.imageName);

    if (!existsSync(mediaPath)) {
      throw new Error(`El archivo ${dto.imageName} no existe en la carpeta upload`);
    }

    const media = await MessageMedia.fromFilePath(mediaPath);
    await this.client.sendMessage(chatId, media, { caption: dto.caption });
  }

  private isSupportedChat(chat: Chat): boolean {
    const server = chat.id?.server ?? null;
    return (
      !chat.isGroup &&
      Boolean(server) &&
      WhatsappService.SUPPORTED_CHAT_SERVERS.has(server)
    );
  }

  private async mapChatSummary(chat: Chat): Promise<WhatsappConversationSummary> {
    const { displayName, number } = await this.resolveChatIdentity(chat);
    const lastMessage = chat.lastMessage
      ? await this.mapMessagePayload(chat.lastMessage, chat.id._serialized)
      : null;

    return {
      id: chat.id._serialized,
      displayName,
      number,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount ?? 0,
      archived: Boolean(chat.archived),
      muted: Boolean(chat.isMuted),
      lastMessage,
      updatedAt: lastMessage?.timestamp ?? this.extractChatTimestamp(chat),
    };
  }

  private async resolveChatIdentity(
    chat: Chat,
  ): Promise<{ displayName: string; number: string | null }> {
    if (chat.isGroup) {
      const groupName = chat.name?.trim();
      const displayName =
        groupName && groupName.length > 0 ? groupName : chat.id._serialized;
      return { displayName, number: null };
    }

    const contact = await chat
      .getContact()
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : JSON.stringify(error);
        this.logger.debug(
          `Unable to resolve contact for chat ${chat.id._serialized}: ${message}`,
        );
        return null;
      });

    const number = contact?.number ?? chat.id?.user ?? null;
    const displayName =
      [chat.name, contact?.pushname, contact?.name, number, chat.id?._serialized]
        .find((value) => value && value.trim().length > 0)
        ?.trim() ?? 'Contacto sin nombre';

    return { displayName, number };
  }

  private trimMediaCache(): void {
    while (this.mediaCache.size > WhatsappService.MEDIA_CACHE_LIMIT) {
      const iterator = this.mediaCache.keys().next();
      if (iterator.done || !iterator.value) {
        break;
      }
      this.mediaCache.delete(iterator.value);
    }
  }

  private extractChatTimestamp(chat: Chat): string | null {
    if (chat.lastMessage?.timestamp) {
      return new Date(chat.lastMessage.timestamp * 1000).toISOString();
    }

    if (chat.timestamp) {
      return new Date(chat.timestamp * 1000).toISOString();
    }

    return null;
  }

  private async mapMessagePayload(
    message: Message,
    chatId: string,
  ): Promise<WhatsappMessagePayload> {
    const timestamp = message.timestamp
      ? new Date(message.timestamp * 1000).toISOString()
      : new Date().toISOString();

    let senderName: string | null = null;
    let senderId: string | null = null;

    try {
      const contact = await message.getContact();
      if (message.fromMe) {
        senderName = this.pushName ?? 'Yo';
        senderId = this.client?.info?.wid?._serialized ?? this.number;
      } else {
        senderName =
          [contact?.pushname, contact?.name, contact?.number]
            .find((value) => value && value.trim().length > 0)
            ?.trim() ?? null;
        senderId = contact?.id?._serialized ?? contact?.number ?? message.from ?? null;
      }
    } catch {
      senderName = message.fromMe ? this.pushName ?? 'Yo' : null;
      senderId = message.fromMe
        ? this.client?.info?.wid?._serialized ?? this.number
        : message.author ?? message.from ?? null;
    }

    if (!senderId) {
      senderId = message.fromMe
        ? this.client?.info?.wid?._serialized ?? this.number
        : message.author ?? message.from ?? null;
    }

    let media: WhatsappMessagePayload['media'] = null;

    if (message.hasMedia) {
      media = this.mediaCache.get(message.id._serialized) ?? null;

      if (!media) {
        try {
          const downloaded = await message.downloadMedia();
          if (downloaded?.data) {
            const rawDuration = (message as unknown as { duration?: number | string }).duration;
            const parsedDuration =
              typeof rawDuration === 'number'
                ? rawDuration
                : typeof rawDuration === 'string'
                  ? Number.parseFloat(rawDuration)
                  : null;
            const durationSeconds =
              typeof parsedDuration === 'number' && Number.isFinite(parsedDuration)
                ? Math.max(0, Math.round(parsedDuration))
                : null;

            media = {
              mimetype: downloaded.mimetype,
              data: downloaded.data,
              fileName: downloaded.filename ?? null,
              fileSize:
                typeof downloaded.filesize === 'number' && Number.isFinite(downloaded.filesize)
                  ? downloaded.filesize
                  : null,
              durationSeconds,
            };

            this.mediaCache.set(message.id._serialized, media);
            this.trimMediaCache();
          }
        } catch (error) {
          this.logger.warn(
            `Failed to download media for WhatsApp message ${message.id._serialized}`,
            error as Error,
          );
          media = null;
        }
      }
    }

    return {
      id: message.id._serialized,
      chatId,
      body: message.body ?? '',
      fromMe: message.fromMe,
      senderId,
      senderName,
      timestamp,
      type: message.type,
      hasMedia: message.hasMedia,
      ack: message.ack ?? null,
      media,
    };
  }

  private createClient(): Client {
    const client = new Client({
      authStrategy: new LocalAuth({
        dataPath: this.sessionPath,
      }),
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
        ],
      },
    });

    this.attachClientListeners(client);

    return client;
  }

  private attachClientListeners(client: Client): void {
    client.on('qr', async (qr: string) => {
      this.logger.log('WhatsApp QR code received');
      const token = ++this.qrGenerationToken;
      this.status = 'qr';
      this.isReady = false;
      this.number = null;
      this.pushName = null;
      const generatedAt = new Date();

      try {
        const dataUrl = await qrcode.toDataURL(qr, { errorCorrectionLevel: 'M' });

        if (this.qrGenerationToken !== token || this.status !== 'qr') {
          // QR was superseded by a newer event or the client connected meanwhile.
          return;
        }

        this.qrGeneratedAt = generatedAt;
        this.qrDataUrl = dataUrl;
      } catch (error) {
        if (this.qrGenerationToken === token && this.status === 'qr') {
          this.qrGeneratedAt = null;
          this.qrDataUrl = null;
          this.status = 'failed';
        }
        this.logger.error('Failed to generate WhatsApp QR code image', error as Error);
      }
    });

    client.on('authenticated', () => {
      this.logger.log('WhatsApp client authenticated');
      this.status = 'authenticated';
      this.qrDataUrl = null;
      this.qrGeneratedAt = null;
    });

    client.on('ready', async () => {
      this.logger.log('WhatsApp client ready');
      this.status = 'connected';
      this.isReady = true;
      this.qrDataUrl = null;
      this.qrGeneratedAt = null;
      this.qrGenerationToken = 0;
      this.number = client.info?.wid?.user ?? null;
      this.pushName = client.info?.pushname ?? null;

      // NUEVO: sincronizar chats y mensajes recientes
      try {
        await this.syncAllChatsFromWhatsapp();
      } catch (error) {
        this.logger.error('Error during initial WhatsApp sync', error as Error);
      }
    });

    client.on('disconnected', async (reason: string) => {
      this.logger.warn(`WhatsApp client disconnected: ${reason}`);
      this.status = 'disconnected';
      this.isReady = false;
      this.number = null;
      this.pushName = null;
      this.qrGenerationToken = 0;
      await this.recreateClient();
      this.initializeClient();
    });

    client.on('auth_failure', (message) => {
      this.logger.error(`WhatsApp authentication failed: ${message}`);
      this.status = 'failed';
      this.isReady = false;
      this.qrDataUrl = null;
      this.qrGeneratedAt = null;
      this.qrGenerationToken = 0;
    });

    client.on('message', async (message) => {
      try {
        const chat = await message.getChat();
        if (!this.isSupportedChat(chat)) return;

        await this.upsertChatFromWhatsapp(chat);
        await this.persistMessageFromWhatsapp(message, chat.id._serialized);
      } catch (error) {
        this.logger.error('Error syncing incoming WhatsApp message', error as Error);
      }
    });

    client.on('message_create', async (message) => {
      try {
        const chat = await message.getChat();
        if (!this.isSupportedChat(chat)) return;

        await this.upsertChatFromWhatsapp(chat);
        await this.persistMessageFromWhatsapp(message, chat.id._serialized);
      } catch (error) {
        this.logger.error('Error syncing created WhatsApp message', error as Error);
      }
    });
  }

  private initializeClient(forceNew = false): void {
    if (this.isInitializing) {
      return;
    }

    this.isInitializing = true;
    this.status = 'connecting';

    if (forceNew) {
      this.recreateClient()
        .then(() => {
          this.isInitializing = false;
          this.initializeClient();
        })
        .catch((error) => {
          this.logger.error('Failed to recreate WhatsApp client', error as Error);
          this.isInitializing = false;
          this.status = 'failed';
        });
      return;
    }

    this.client
      .initialize()
      .catch((error) => {
        this.logger.error('Error initializing WhatsApp client', error as Error);
        this.status = 'failed';
      })
      .finally(() => {
        this.isInitializing = false;
      });
  }

  private async recreateClient(): Promise<void> {
    try {
      this.client.removeAllListeners();
      await this.client.destroy();
    } catch (error) {
      this.logger.warn('Error destroying existing WhatsApp client', error as Error);
    }

    this.client = this.createClient();
    this.isReady = false;
    this.qrDataUrl = null;
    this.qrGeneratedAt = null;
    this.qrGenerationToken = 0;
  }

  private async ensureClientReady(): Promise<void> {
    if (this.isReady) {
      return;
    }

    throw new ServiceUnavailableException('El cliente de WhatsApp no está conectado');
  }

  private resolveChatId(raw: string): string {
    const value = raw?.trim();

    if (!value) {
      throw new BadRequestException('El identificador de chat es inválido');
    }

    if (value.includes('@')) {
      return value;
    }

    const digits = value.replace(/\D/g, '');

    if (!digits) {
      throw new BadRequestException('El número de destino es inválido');
    }

    return `${digits}@c.us`;
  }

  private async syncAllChatsFromWhatsapp(): Promise<void> {
    await this.ensureClientReady();

    const chats = await this.client.getChats();

    for (const chat of chats) {
      if (!this.isSupportedChat(chat)) continue;

      // Upsert del chat
      const { displayName, number } = await this.resolveChatIdentity(chat);
      const updatedAt = this.extractChatTimestamp(chat);

      await this.chatRepo.save({
        id: chat.id._serialized,
        displayName,
        number,
        isGroup: chat.isGroup,
        unreadCount: chat.unreadCount ?? 0,
        archived: Boolean(chat.archived),
        muted: Boolean(chat.isMuted),
        updatedAt: updatedAt ? new Date(updatedAt) : null,
      });

      // Traer, por ejemplo, los últimos 200 mensajes por chat para tener “historial base”
      const messages = await chat.fetchMessages({ limit: 200 });
      for (const msg of messages) {
        await this.persistMessageFromWhatsapp(msg, chat.id._serialized);
      }
    }
  }

  private async upsertChatFromWhatsapp(chat: Chat): Promise<void> {
    if (!this.isSupportedChat(chat)) return;
    const { displayName, number } = await this.resolveChatIdentity(chat);
    const updatedAt = this.extractChatTimestamp(chat);

    await this.chatRepo.save({
      id: chat.id._serialized,
      displayName,
      number,
      isGroup: chat.isGroup,
      unreadCount: chat.unreadCount ?? 0,
      archived: Boolean(chat.archived),
      muted: Boolean(chat.isMuted),
      updatedAt: updatedAt ? new Date(updatedAt) : null,
    });
  }

  private async persistMessageFromWhatsapp(message: Message, chatId: string): Promise<void> {
    const payload = await this.mapMessagePayload(message, chatId);

    // Si ya lo tenemos, no hacemos nada (id PRIMARY KEY)
    const exists = await this.messageRepo.findOne({ where: { id: payload.id } });
    if (exists) return;

    await this.messageRepo.save({
      id: payload.id,
      chatId: payload.chatId,
      body: payload.body,
      fromMe: payload.fromMe,
      senderId: payload.senderId,
      senderName: payload.senderName,
      timestamp: new Date(payload.timestamp),
      type: payload.type,
      hasMedia: payload.hasMedia,
      ack: payload.ack,
      mediaDataBase64: payload.media?.data ?? null,
      mediaMimeType: payload.media?.mimetype ?? null,
      mediaFileName: payload.media?.fileName ?? null,
      mediaFileSize: payload.media?.fileSize ?? null,
      mediaDurationSeconds: payload.media?.durationSeconds ?? null,
    });

    // actualizar updatedAt del chat
    await this.chatRepo.update(
      { id: chatId },
      { updatedAt: new Date(payload.timestamp) },
    );
  }


  private async backfillChatHistoryForLastMonths(
    chatId: string,
    months = 6,
  ): Promise<void> {
    await this.ensureClientReady();

    const chat = await this.client.getChatById(chatId);
    if (!chat || !this.isSupportedChat(chat)) return;

    // Aseguramos que el chat exista en DB
    await this.upsertChatFromWhatsapp(chat);

    const now = new Date();
    const fromDate = new Date(now);
    fromDate.setMonth(fromDate.getMonth() - months); // ahora - 6 meses

    // Pequeña optimización: si el chat no tiene actividad en los últimos 6 meses, lo saltamos
    // chat.timestamp es Unix en segundos (última actividad del chat):contentReference[oaicite:3]{index=3}
    if (chat.timestamp) {
      const chatLastActivity = new Date(chat.timestamp * 1000);
      if (chatLastActivity < fromDate) {
        // Nada que traer de los últimos 6 meses
        return;
      }
    }

    // Traemos "muchos" mensajes; ajustá el límite según tu realidad
    const MAX_LIMIT = 5000;

    const messages = await chat.fetchMessages({ limit: MAX_LIMIT });

    for (const msg of messages) {
      const msgDate = new Date(msg.timestamp * 1000); // timestamp Unix en segundos

      if (msgDate >= fromDate) {
        // Sólo guardamos si está dentro de la ventana de 6 meses
        await this.persistMessageFromWhatsapp(msg, chat.id._serialized);
      }
    }

    // Podés marcar el chat como "backfilleado" si querés evitar repetir la operación
    await this.chatRepo.update(
      { id: chat.id._serialized },
      { /* historyBackfilled: true, si agregás esa columna */ },
    );
  }
}
