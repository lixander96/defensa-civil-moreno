export interface WhatsappMessageMediaPayload {
  mimetype: string;
  data: string;
  fileName: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
}

export interface WhatsappMessagePayload {
  id: string;
  chatId: string;
  body: string;
  fromMe: boolean;
  senderId: string | null;
  senderName: string | null;
  timestamp: string;
  type: string;
  hasMedia: boolean;
  ack: number | null;
  media?: WhatsappMessageMediaPayload | null;
}

export interface WhatsappConversationSummary {
  id: string;
  displayName: string;
  number: string | null;
  isGroup: boolean;
  unreadCount: number;
  archived: boolean;
  muted: boolean;
  lastMessage: WhatsappMessagePayload | null;
  updatedAt: string | null;
}

export interface WhatsappMessagesResponse {
  chat: WhatsappConversationSummary;
  messages: WhatsappMessagePayload[];
  nextCursor: string | null;
  hasMore: boolean;
}
