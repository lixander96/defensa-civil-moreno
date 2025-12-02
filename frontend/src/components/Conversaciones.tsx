import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react';
import {
  ArrowLeft,
  Loader2,
  MessageCircle,
  Phone,
  Plus,
  RefreshCw,
  Search,
} from 'lucide-react';
import { Input } from './ui/input';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { Card, CardContent } from './ui/card';
import { cn, formatTime, getRelativeTime } from '../lib/utils';
import {
  getWhatsappMessages,
  listWhatsappChats,
  markWhatsappChatRead,
  sendWhatsappMessage,
} from '../lib/api';
import {
  WhatsappChatMessage,
  WhatsappConversationSummary,
} from '../lib/types';
import { toast } from 'sonner';

interface ConversacionesProps {
  token: string | null;
  onCreateReclamo: (conversationId: string) => void;
  onOpenConversation?: (conversationId: string) => void;
  activeConversationId?: string | null;
  onCloseStandalone?: () => void;
}

const REFRESH_INTERVAL_MS = 15000;
const DEFAULT_MESSAGES_LIMIT = 200;
const MESSAGE_CACHE_LIMIT = 50;

interface CachedMessagesEntry {
  messages: WhatsappChatMessage[];
  timestamp: number;
}

const MESSAGE_CACHE = new Map<string, CachedMessagesEntry>();

function getCachedMessages(chatId: string): CachedMessagesEntry | undefined {
  return MESSAGE_CACHE.get(chatId);
}

function setCachedMessages(chatId: string, messages: WhatsappChatMessage[]): void {
  MESSAGE_CACHE.set(chatId, { messages, timestamp: Date.now() });

  if (MESSAGE_CACHE.size > MESSAGE_CACHE_LIMIT) {
    let oldestKey: string | undefined;
    let oldestTimestamp = Number.POSITIVE_INFINITY;

    MESSAGE_CACHE.forEach((entry, key) => {
      if (entry.timestamp < oldestTimestamp) {
        oldestTimestamp = entry.timestamp;
        oldestKey = key;
      }
    });

    if (oldestKey !== undefined) {
      MESSAGE_CACHE.delete(oldestKey);
    }
  }
}

function clearMessageCache(): void {
  MESSAGE_CACHE.clear();
}

interface ChatCacheEntry {
  chats: WhatsappConversationSummary[];
  timestamp: number;
}

let CHAT_CACHE: ChatCacheEntry | null = null;
let LAST_SELECTED_CHAT_ID: string | null = null;

function getChatCache(): ChatCacheEntry | null {
  return CHAT_CACHE;
}

function setChatCache(chats: WhatsappConversationSummary[]): void {
  CHAT_CACHE = {
    chats,
    timestamp: Date.now(),
  };
}

function clearChatCache(): void {
  CHAT_CACHE = null;
  LAST_SELECTED_CHAT_ID = null;
}

function getLastSelectedChatId(): string | null {
  return LAST_SELECTED_CHAT_ID;
}

function setLastSelectedChatId(id: string | null): void {
  LAST_SELECTED_CHAT_ID = id ?? null;
}

function formatFileSize(bytes: number | null | undefined): string | null {
  if (typeof bytes !== 'number' || !Number.isFinite(bytes) || bytes <= 0) {
    return null;
  }

  if (bytes < 1024) {
    return `${bytes} B`;
  }

  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }

  if (bytes < 1024 * 1024 * 1024) {
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
}

function buildMediaDataUrl(
  media: WhatsappChatMessage['media'] | null | undefined,
): string | null {
  if (!media || !media.data || !media.mimetype) {
    return null;
  }
  return `data:${media.mimetype};base64,${media.data}`;
}

function formatDuration(seconds: number | null | undefined): string | null {
  if (typeof seconds !== 'number' || !Number.isFinite(seconds) || seconds <= 0) {
    return null;
  }

  const totalSeconds = Math.round(seconds);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const remainingSeconds = totalSeconds % 60;

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds
      .toString()
      .padStart(2, '0')}`;
  }

  return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
}

function getMediaPreviewLabel(
  message: WhatsappChatMessage | null | undefined,
): string | null {
  const mimetype = message?.media?.mimetype;
  if (!mimetype) {
    return null;
  }

  if (mimetype.startsWith('image/')) {
    return 'Imagen';
  }
  if (mimetype.startsWith('audio/')) {
    return 'Audio';
  }
  if (mimetype.startsWith('video/')) {
    return 'Video';
  }
  return 'Archivo';
}

interface ChatListItemProps {
  chat: WhatsappConversationSummary;
  isActive: boolean;
  onSelect: (chatId: string) => void;
}

function ChatListItem({ chat, isActive, onSelect }: ChatListItemProps) {
  const lastMessage = chat.lastMessage;
  const lastMessageTime = lastMessage?.timestamp;
  const handleClick = () => onSelect(chat.id);
  const mediaLabel = getMediaPreviewLabel(lastMessage);
  const messagePreview =
    lastMessage?.body && lastMessage.body.trim().length > 0
      ? lastMessage.body
      : mediaLabel
      ? `[${mediaLabel}]`
      : 'Mensaje sin contenido';

  return (
    <Card
      onClick={handleClick}
      className={cn(
        'mb-2 cursor-pointer border-l-4 transition-colors duration-150',
        isActive ? 'border-l-primary bg-accent/60' : 'border-l-transparent hover:bg-accent/30',
      )}
    >
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate font-medium">{chat.displayName}</h4>
              {chat.unreadCount > 0 && (
                <Badge
                  variant="destructive"
                  className="h-5 w-5 min-w-[1.25rem] p-0 text-xs"
                >
                  {chat.unreadCount}
                </Badge>
              )}
            </div>
            {chat.number && (
              <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                <Phone className="h-3 w-3" />
                <span className="truncate">{chat.number}</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-end gap-1 text-right text-xs text-muted-foreground">
            {lastMessageTime && <span>{formatTime(lastMessageTime)}</span>}
            {lastMessageTime && (
              <span className="text-[10px]">{getRelativeTime(lastMessageTime)}</span>
            )}
          </div>
        </div>
        <p className="truncate text-sm text-muted-foreground">
          {messagePreview}
        </p>
      </CardContent>
    </Card>
  );
}

interface MessageBubbleProps {
  message: WhatsappChatMessage;
}

function MessageBubble({ message }: MessageBubbleProps) {
  const alignment = message.fromMe ? 'justify-end' : 'justify-start';
  const bubbleStyles = message.fromMe
    ? 'bg-primary text-primary-foreground'
    : 'bg-muted text-foreground';
  const helperTextClass = message.fromMe
    ? 'text-primary-foreground/80'
    : 'text-muted-foreground';

  const mediaLabel = getMediaPreviewLabel(message);
  const dataUrl = buildMediaDataUrl(message.media);
  const sizeLabel = formatFileSize(message.media?.fileSize);
  const durationLabel = formatDuration(message.media?.durationSeconds);
  const metadataParts = [
    message.media?.fileName ?? null,
    sizeLabel,
    durationLabel,
  ].filter(Boolean) as string[];

  const metadata =
    metadataParts.length > 0 ? (
      <p className={cn('text-xs', helperTextClass)}>{metadataParts.join(' • ')}</p>
    ) : null;

  let mediaContent: ReactNode = null;
  if (dataUrl && message.media?.mimetype) {
    if (message.media.mimetype.startsWith('image/')) {
      mediaContent = (
        <div className="space-y-1">
          <img
            src={dataUrl}
            alt={message.media.fileName ?? mediaLabel ?? 'Imagen recibida'}
            className="max-h-72 w-full rounded-md object-contain"
            loading="lazy"
          />
          {metadata}
        </div>
      );
    } else if (message.media.mimetype.startsWith('audio/')) {
      mediaContent = (
        <div className="space-y-1 overflow-x-auto">
          <audio
            controls
            src={dataUrl}
            className="w-[300%] max-w-none"
          >
            Tu navegador no soporta audio embebido.
          </audio>
          {metadata}
        </div>
      );
    } else if (message.media.mimetype.startsWith('video/')) {
      mediaContent = (
        <div className="space-y-1">
          <video
            controls
            src={dataUrl}
            className="max-h-72 w-full rounded-md bg-black object-contain"
            preload="metadata"
          >
            Tu navegador no soporta video embebido.
          </video>
          {metadata}
        </div>
      );
    } else {
      mediaContent = (
        <div className="space-y-1">
          <a
            href={dataUrl}
            download={message.media.fileName ?? 'archivo'}
            className="inline-flex items-center text-sm underline"
          >
            Descargar {mediaLabel?.toLowerCase() ?? 'archivo'}
          </a>
          {metadata}
        </div>
      );
    }
  }

  const hasBody = Boolean(message.body && message.body.trim().length > 0);

  return (
    <div className={cn('flex', alignment)}>
      <div className={cn('max-w-[75%] rounded-lg px-3 py-2 text-sm space-y-2', bubbleStyles)}>
        {mediaContent}
        {hasBody ? (
          <p className="whitespace-pre-wrap break-words">{message.body}</p>
        ) : !mediaContent ? (
          <p className={cn('italic', helperTextClass)}>Mensaje sin texto</p>
        ) : null}
        <div className="mt-1 flex justify-end text-xs opacity-70">
          {formatTime(message.timestamp)}
        </div>
      </div>
    </div>
  );
}

export function Conversaciones({
  token,
  onCreateReclamo,
  onOpenConversation,
  activeConversationId,
  onCloseStandalone,
}: ConversacionesProps) {
  const [chats, setChats] = useState<WhatsappConversationSummary[]>([]);
  const [isLoadingChats, setIsLoadingChats] = useState(false);
  const [isRefreshingChats, setIsRefreshingChats] = useState(false);
  const [chatsError, setChatsError] = useState<string | null>(null);

  const [selectedChatId, setSelectedChatId] = useState<string | null>(
    activeConversationId ?? null,
  );
  const [messages, setMessages] = useState<WhatsappChatMessage[]>([]);
  const [isLoadingMessages, setIsLoadingMessages] = useState(false);
  const [messagesError, setMessagesError] = useState<string | null>(null);
  const [messageDraft, setMessageDraft] = useState('');
  const [isSending, setIsSending] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');

  const isStandalone = Boolean(onCloseStandalone);

  const filteredChats = useMemo(() => {
    if (!searchTerm.trim()) {
      return chats;
    }

    const term = searchTerm.trim().toLowerCase();
    return chats.filter((chat) => {
      const haystack = [
        chat.displayName,
        chat.number ?? '',
        chat.lastMessage?.body ?? '',
      ]
        .join(' ')
        .toLowerCase();
      return haystack.includes(term);
    });
  }, [chats, searchTerm]);

  const selectedChat = useMemo(
    () => (selectedChatId ? chats.find((chat) => chat.id === selectedChatId) ?? null : null),
    [chats, selectedChatId],
  );

  const loadChats = useCallback(
    async (withLoader: boolean) => {
      if (!token) {
        setChats([]);
        clearChatCache();
        return;
      }

      const cached = getChatCache();
      const shouldShowLoader = withLoader && !(cached && cached.chats.length > 0);

      if (shouldShowLoader) {
        setIsLoadingChats(true);
      } else if (!withLoader) {
        setIsRefreshingChats(true);
      }

      setChatsError(null);
      try {
        const data = await listWhatsappChats(token);
        setChats(data);
        setChatCache(data);
      } catch (error) {
        console.error('Failed to load WhatsApp chats', error);
        setChatsError('No se pudieron cargar las conversaciones de WhatsApp');
      } finally {
        if (shouldShowLoader) {
          setIsLoadingChats(false);
        } else if (!withLoader) {
          setIsRefreshingChats(false);
        }
      }
    },
    [token],
  );

  const refreshChats = useCallback(() => {
    void loadChats(false);
  }, [loadChats]);

  useEffect(() => {
    if (!token) {
      setChats([]);
      clearChatCache();
      setIsLoadingChats(false);
      setIsRefreshingChats(false);
      setChatsError(null);
      return;
    }

    const cached = getChatCache();
    if (cached) {
      setChats(cached.chats);
      setIsLoadingChats(false);
      setChatsError(null);
      void loadChats(false);
    } else {
      void loadChats(true);
    }
  }, [token, loadChats]);

  useEffect(() => {
    if (!token) {
      return;
    }

    const interval = setInterval(() => {
      refreshChats();
    }, REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [token, refreshChats]);

  useEffect(() => {
    if (isStandalone) {
      const desired =
        activeConversationId ??
        (selectedChatId && chats.some((chat) => chat.id === selectedChatId)
          ? selectedChatId
          : getLastSelectedChatId());
      setSelectedChatId(desired ?? null);
      return;
    }

    if (activeConversationId) {
      setSelectedChatId(activeConversationId);
      return;
    }

    setSelectedChatId((current) => {
      if (current && chats.some((chat) => chat.id === current)) {
        return current;
      }

      const cachedSelected = getLastSelectedChatId();
      if (cachedSelected && chats.some((chat) => chat.id === cachedSelected)) {
        return cachedSelected;
      }

      return chats[0]?.id ?? null;
    });
  }, [isStandalone, activeConversationId, chats, selectedChatId]);

  useEffect(() => {
    if (selectedChatId) {
      setLastSelectedChatId(selectedChatId);
    }
  }, [selectedChatId]);

  useEffect(() => {
    if (!token) {
      setMessages([]);
      clearMessageCache();
      return;
    }

    if (!selectedChatId) {
      setMessages([]);
      return;
    }

    let cancelled = false;
    const currentChatId = selectedChatId;
    const cached = getCachedMessages(currentChatId);

    const loadMessages = async (showLoader: boolean) => {
      if (showLoader) {
        setIsLoadingMessages(true);
      }
      setMessagesError(null);

      try {
        const response = await getWhatsappMessages(token, currentChatId, {
          limit: DEFAULT_MESSAGES_LIMIT,
        });

        if (cancelled) {
          return;
        }

        setMessages(response.messages);
        setCachedMessages(currentChatId, response.messages);
        setChats((prev) => {
          const exists = prev.some((chat) => chat.id === response.chat.id);
          const next = exists
            ? prev.map((chat) =>
                chat.id === response.chat.id ? response.chat : chat,
              )
            : [...prev, response.chat];
          setChatCache(next);
          return next;
        });

        try {
          await markWhatsappChatRead(token, currentChatId);
          if (!cancelled) {
            setChats((prev) => {
              const next = prev.map((chat) =>
                chat.id === currentChatId ? { ...chat, unreadCount: 0 } : chat,
              );
              setChatCache(next);
              return next;
            });
          }
        } catch (error) {
          console.debug('Unable to mark chat as read', error);
        }
      } catch (error) {
        console.error('Failed to load WhatsApp messages', error);
        if (!cancelled) {
          setMessagesError('No se pudieron cargar los mensajes de la conversacion');
        }
      } finally {
        if (!cancelled && showLoader) {
          setIsLoadingMessages(false);
        }
      }
    };

    if (cached) {
      setMessages(cached.messages);
      setIsLoadingMessages(false);
      setMessagesError(null);
      void loadMessages(false);
    } else {
      setMessages([]);
      setIsLoadingMessages(true);
      setMessagesError(null);
      void loadMessages(true);
    }

    return () => {
      cancelled = true;
    };
  }, [token, selectedChatId]);

  const handleSelectChat = useCallback(
    (chatId: string) => {
      if (!chatId) {
        return;
      }

      const cachedMessages = getCachedMessages(chatId);
      if (cachedMessages) {
        setMessages(cachedMessages.messages);
        setIsLoadingMessages(false);
        setMessagesError(null);
      }

      if (!isStandalone) {
        setSelectedChatId(chatId);

        if (onOpenConversation) {
          const isMobile =
            typeof window !== 'undefined'
              ? window.matchMedia('(max-width: 767px)').matches
              : false;
          if (isMobile) {
            onOpenConversation(chatId);
          }
        }
      } else {
        setSelectedChatId(chatId);
      }
    },
    [isStandalone, onOpenConversation],
  );

  const handleSendMessage = useCallback(async () => {
    if (!token || !selectedChatId) {
      return;
    }

    const trimmed = messageDraft.trim();
    if (!trimmed) {
      return;
    }

    setIsSending(true);
    try {
      const sentMessage = await sendWhatsappMessage(token, selectedChatId, trimmed);
      setMessageDraft('');
      setMessages((prev) => {
        const next = [...prev, sentMessage];
        setCachedMessages(selectedChatId, next);
        return next;
      });
      setChats((prev) => {
        const next = prev.map((chat) =>
          chat.id === selectedChatId
            ? {
                ...chat,
                lastMessage: sentMessage,
                updatedAt: sentMessage.timestamp,
                unreadCount: 0,
              }
            : chat,
        );
        setChatCache(next);
        return next;
      });
      refreshChats();
    } catch (error) {
      console.error('Failed to send WhatsApp message', error);
      toast.error('No se pudo enviar el mensaje de WhatsApp');
    } finally {
      setIsSending(false);
    }
  }, [token, selectedChatId, messageDraft, refreshChats]);

  const handleSubmitMessage = useCallback(
    (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      void handleSendMessage();
    },
    [handleSendMessage],
  );

  if (token === null) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 p-6 text-center text-muted-foreground">
        <MessageCircle className="h-10 w-10" />
        <p>Inicia sesión para gestionar las conversaciones de WhatsApp.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {isStandalone && (
        <div className="flex items-center gap-2 border-b px-4 py-3">
          <Button
            variant="ghost"
            size="sm"
            className="gap-2"
            onClick={onCloseStandalone}
          >
            <ArrowLeft className="h-4 w-4" />
            Volver
          </Button>
          <h1 className="text-base font-semibold">Conversación</h1>
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {!isStandalone && (
          <aside className="flex w-full flex-col border-r bg-card/30 md:w-80 lg:w-96">
            <div className="border-b p-4">
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                  <Input
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                    placeholder="Buscar por nombre, número o mensaje"
                    className="pl-8"
                  />
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => refreshChats()}
                  disabled={isRefreshingChats}
                >
                  {isRefreshingChats ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <RefreshCw className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4">
              {isLoadingChats ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  Cargando conversaciones...
                </div>
              ) : chatsError ? (
                <div className="text-sm text-destructive">{chatsError}</div>
              ) : filteredChats.length === 0 ? (
                <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                  No hay conversaciones disponibles.
                </div>
              ) : (
                filteredChats.map((chat) => (
                  <ChatListItem
                    key={chat.id}
                    chat={chat}
                    isActive={chat.id === selectedChatId}
                    onSelect={handleSelectChat}
                  />
                ))
              )}
            </div>
          </aside>
        )}

        <section
          className={cn(
            'flex flex-1 flex-col',
            !isStandalone && 'hidden md:flex',
          )}
        >
          {selectedChat ? (
            <>
              <div className="flex items-center justify-between border-b px-4 py-3">
                <div className="min-w-0">
                  <h2 className="truncate text-lg font-semibold">
                    {selectedChat.displayName}
                  </h2>
                  {selectedChat.number && (
                    <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
                      <Phone className="h-3.5 w-3.5" />
                      <span>{selectedChat.number}</span>
                    </div>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {!isStandalone && onOpenConversation && (
                    <Button
                      variant="outline"
                      size="sm"
                      className="md:hidden"
                      onClick={() => onOpenConversation(selectedChat.id)}
                    >
                      Abrir
                    </Button>
                  )}
                  <Button
                    size="sm"
                    onClick={() => onCreateReclamo(selectedChat.id)}
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Crear reclamo
                  </Button>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto px-4 py-3">
                {isLoadingMessages ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Cargando mensajes...
                  </div>
                ) : messagesError ? (
                  <div className="text-sm text-destructive">{messagesError}</div>
                ) : messages.length === 0 ? (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Aún no hay mensajes en esta conversación.
                  </div>
                ) : (
                  <div className="flex flex-col gap-3">
                    {messages.map((message) => (
                      <MessageBubble key={message.id} message={message} />
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t px-4 py-3">
                <form className="flex items-center gap-2" onSubmit={handleSubmitMessage}>
                  <Input
                    value={messageDraft}
                    onChange={(event) => setMessageDraft(event.target.value)}
                    placeholder="Escribe un mensaje..."
                    disabled={isSending}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' && !event.shiftKey) {
                        event.preventDefault();
                        void handleSendMessage();
                      }
                    }}
                  />
                  <Button type="submit" disabled={isSending || !messageDraft.trim()}>
                    {isSending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      'Enviar'
                    )}
                  </Button>
                </form>
              </div>
            </>
          ) : (
            <div className="flex flex-1 items-center justify-center bg-muted/30">
              <div className="text-center text-muted-foreground">
                <MessageCircle className="mx-auto mb-3 h-10 w-10" />
                Selecciona una conversación para ver los mensajes.
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
