export type UserRole =
  | 'ADMIN'
  | 'MANAGER'
  | 'OPERATOR'
  | 'AGENT'
  | 'administrador'
  | 'operador'
  | 'agente'
  | 'manager';

export interface User {
  id: string;
  username: string;
  name: string;
  role: UserRole;
  phone?: string;
  firstName?: string;
  lastName?: string;
}

export interface Denunciante {
  id: string;
  name: string;
  phone: string;
  address?: string;
}

export interface Reclamo {
  id: string;
  number: string;
  type: string;
  typeLabel?: string;
  typeInfo?: IncidentType;
  description: string;
  denunciante: Denunciante;
  address: string;
  location: {
    lat: number;
    lng: number;
  } | null;
  status: 'abierto' | 'derivado' | 'en_camino' | 'verificado' | 'cerrado';
  priority: 'alta' | 'media' | 'baja';
  assignedTo?: string;
  assignedToName?: string;
  derivedTo?: string;
  createdAt: Date;
  updatedAt: Date;
  attachments: string[];
  timeline: TimelineEvent[];
}

export interface TimelineEvent {
  id: string;
  type: 'created' | 'assigned' | 'derived' | 'in_route' | 'verified' | 'closed' | 'message';
  description: string;
  user: string;
  timestamp: Date;
  data?: any;
}

export interface Conversation {
  id: string;
  reclamoId?: string;
  denunciante: Denunciante;
  status: 'abierta' | 'cerrada';
  lastMessage: Message;
  unreadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Message {
  id: string;
  conversationId: string;
  sender: 'denunciante' | 'operador' | 'system';
  content: string;
  timestamp: Date;
  type: 'text' | 'image' | 'location' | 'system';
  attachments?: string[];
}

export interface KPI {
  totalReclamos: number;
  reclamosAbiertos: number;
  tiempoPromedioRespuesta: number;
  slaCompliance: number;
  reclamosPorTipo: Record<string, number>;
  reclamosPorEstado: Record<string, number>;
}

export interface WhatsAppContact {
  id: string;
  name: string;
  phone: string;
  description?: string; // "Director", "Zona Centro", etc.
  active: boolean;
}

export interface DerivationArea {
  id: string;
  name: string;
  description: string;
  whatsappContacts: WhatsAppContact[];
  active: boolean;
  color: string;
  icon: string;
}

export interface AreaSummary {
  id: number;
  name: string;
  isVisible: boolean;
  areaType?: {
    id: number;
    name: string;
  };
}

export interface IncidentType {
  id: string;
  backendId?: number;
  name: string;
  description: string;
  derivationAreaId: string;
  priority: 'alta' | 'media' | 'baja';
  icon: string;
  color: string;
  active: boolean;
  autoDerive: boolean;
}

export type WhatsappConnectionStatus =
  | 'idle'
  | 'connecting'
  | 'qr'
  | 'authenticated'
  | 'connected'
  | 'disconnected'
  | 'failed';

export interface WhatsappStatus {
  status: WhatsappConnectionStatus;
  number?: string | null;
  pushName?: string | null;
  qr?: {
    dataUrl: string;
    generatedAt: string;
  } | null;
}

export interface WhatsappMessageMedia {
  data: string;
  mimetype: string;
  fileName: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
}

export interface WhatsappChatMessage {
  id: string;
  chatId: string;
  body: string;
  fromMe: boolean;
  senderId: string | null;
  senderName: string | null;
  timestamp: Date;
  type: string;
  hasMedia: boolean;
  ack: number | null;
  media?: WhatsappMessageMedia | null;
}

export interface WhatsappConversationSummary {
  id: string;
  displayName: string;
  number: string | null;
  isGroup: boolean;
  unreadCount: number;
  archived: boolean;
  muted: boolean;
  lastMessage: WhatsappChatMessage | null;
  updatedAt: Date | null;
}

export interface WhatsappMessagesResult {
  chat: WhatsappConversationSummary;
  messages: WhatsappChatMessage[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ReportSummary {
  range: {
    from: string | null;
    to: string | null;
  };
  generatedAt: string;
  totals: {
    totalComplaints: number;
    activeComplaints: number;
    closedComplaints: number;
  };
  timeMetrics: {
    averageAssignmentMinutes: number | null;
    averageArrivalMinutes: number | null;
    averageResolutionMinutes: number | null;
    slaCompliance: number | null;
  };
  agentsInField: number;
  byType: ReportTypeSummary[];
  byStatus: ReportStatusSummary[];
  performanceByType: ReportPerformanceSummary[];
  weeklyTrend: ReportDailyTrend[];
  heatmap: ReportHeatmapRow[];
}

export interface ReportTypeSummary {
  typeId: number | null;
  typeName: string;
  total: number;
  percentage: number;
  color: string | null;
}

export interface ReportStatusSummary {
  status: Reclamo['status'];
  total: number;
}

export interface ReportPerformanceSummary {
  typeId: number | null;
  typeName: string;
  averageAssignmentMinutes: number | null;
  averageArrivalMinutes: number | null;
  slaCompliance: number | null;
}

export interface ReportDailyTrend {
  date: string;
  created: number;
  resolved: number;
  slaCompliance: number | null;
}

export interface ReportHeatmapRow {
  hour: number;
  areas: ReportHeatmapArea[];
}

export interface ReportHeatmapArea {
  areaId: number | null;
  areaName: string;
  total: number;
}
