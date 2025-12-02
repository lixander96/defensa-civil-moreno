import {
  AreaSummary,
  IncidentType,
  Reclamo,
  User,
  WhatsappChatMessage,
  WhatsappConversationSummary,
  WhatsappMessagesResult,
  WhatsappStatus,
  ReportSummary,
} from './types';

const DEFAULT_API_BASE_URL = 'http://localhost:3000/api';

function resolveBaseUrl(): string {
  const raw = import.meta.env.VITE_API_URL as string | undefined;
  const base = raw && raw.trim().length > 0 ? raw : DEFAULT_API_BASE_URL;
  return base.endsWith('/') ? base.slice(0, -1) : base;
}

const API_BASE_URL = resolveBaseUrl();

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(message: string, status: number, data: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

async function request<T>(
  path: string,
  init: RequestInit = {},
  parseJson: boolean = true,
): Promise<T> {
  const headers = new Headers(init.headers ?? {});
  if (!headers.has('Content-Type') && init.body) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
  });

  if (!response.ok) {
    let errorPayload: unknown = null;
    if (parseJson) {
      try {
        errorPayload = await response.json();
      } catch {
        errorPayload = await response.text();
      }
    } else {
      errorPayload = await response.text();
    }
    throw new ApiError(
      response.statusText || 'Request failed',
      response.status,
      errorPayload,
    );
  }

  if (!parseJson || response.status === 204) {
    return undefined as T;
  }

  try {
    return (await response.json()) as T;
  } catch (error) {
    throw new ApiError('Unable to parse server response', response.status, error);
  }
}

interface AreaTypeResponse {
  id: number;
  name: string;
}

interface AreaResponse {
  id: number;
  name: string;
  isVisible: boolean;
  areaType?: AreaTypeResponse;
}

interface ComplaintTypeResponse {
  id: number;
  code?: string | null;
  name: string;
  description?: string | null;
  isVisible: boolean;
  defaultPriority: 'alta' | 'media' | 'baja';
  autoDerive: boolean;
  icon?: string | null;
  color?: string | null;
  area?: AreaResponse | null;
}

interface UserSummaryResponse {
  id: number;
  username: string;
  firstName?: string | null;
  lastName?: string | null;
}

interface UserResponse {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
}

interface ComplaintLocationResponse {
  lat: number;
  lng: number;
}

interface ComplaintTimelineResponse {
  id: string;
  type: string;
  description: string;
  user: string;
  timestamp: string;
  data?: Record<string, unknown>;
}

interface ComplaintResponse {
  id: string;
  number: string;
  type?: ComplaintTypeResponse | null;
  description: string;
  complainant: {
    id: number;
    name: string;
    phone: string;
    address?: string | null;
  };
  address: string;
  status: 'abierto' | 'derivado' | 'en_camino' | 'verificado' | 'cerrado';
  priority: 'alta' | 'media' | 'baja';
  assignedTo?: UserSummaryResponse | null;
  derivedTo?: string | null;
  location?: ComplaintLocationResponse | null;
  attachments?: string[] | null;
  timeline?: ComplaintTimelineResponse[] | null;
  createdAt: string;
  updatedAt: string;
}

interface ComplaintReportSummaryResponse {
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
  byType: ComplaintReportTypeSummaryResponse[];
  byStatus: ComplaintReportStatusSummaryResponse[];
  performanceByType: ComplaintReportPerformanceSummaryResponse[];
  weeklyTrend: ComplaintReportTrendResponse[];
  heatmap: ComplaintReportHeatmapRowResponse[];
}

interface ComplaintReportTypeSummaryResponse {
  typeId: number | null;
  typeName: string;
  total: number;
  percentage: number;
  color: string | null;
}

interface ComplaintReportStatusSummaryResponse {
  status: 'abierto' | 'derivado' | 'en_camino' | 'verificado' | 'cerrado';
  total: number;
}

interface ComplaintReportPerformanceSummaryResponse {
  typeId: number | null;
  typeName: string;
  averageAssignmentMinutes: number | null;
  averageArrivalMinutes: number | null;
  slaCompliance: number | null;
}

interface ComplaintReportTrendResponse {
  date: string;
  created: number;
  resolved: number;
  slaCompliance: number | null;
}

interface ComplaintReportHeatmapRowResponse {
  hour: number;
  areas: ComplaintReportHeatmapAreaResponse[];
}

interface ComplaintReportHeatmapAreaResponse {
  areaId: number | null;
  areaName: string;
  total: number;
}

export interface ComplaintListParams {
  status?: string;
  priority?: string;
  typeId?: number;
  assignedUserId?: number;
  search?: string;
  limit?: number;
  offset?: number;
}

export interface ComplaintReportSummaryParams {
  from?: Date;
  to?: Date;
  status?: string;
  typeId?: number;
}

export interface ComplaintLocationInput {
  lat: number;
  lng: number;
}

export interface CreateComplaintPayload {
  typeId: number;
  description: string;
  complainantName: string;
  complainantPhone: string;
  complainantAddress?: string;
  address: string;
  priority: 'alta' | 'media' | 'baja';
  status?: 'abierto' | 'derivado' | 'en_camino' | 'verificado' | 'cerrado';
  derivedTo?: string;
  location?: ComplaintLocationInput;
  attachments?: string[];
  assignedUserId?: number;
}

export type UpdateComplaintPayload = Partial<CreateComplaintPayload>;

const INCIDENT_TYPE_DEFAULTS: Record<
  string,
  { icon: string; color: string }
> = {
  incendio: {
    icon: '🔥',
    color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
  },
  fuga_gas: {
    icon: '⚠️',
    color: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400',
  },
  poste_caido: {
    icon: '🚧',
    color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
  },
  inundacion: {
    icon: '🌧️',
    color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
  },
  arbol_caido: {
    icon: '🌳',
    color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
  },
  corte_energia: {
    icon: '💡',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  },
  alumbrado_publico: {
    icon: '🔦',
    color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/20 dark:text-amber-400',
  },
  accidente_transito: {
    icon: '🚔',
    color: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400',
  },
  robo_hurto: {
    icon: '🚨',
    color: 'bg-rose-100 text-rose-800 dark:bg-rose-900/20 dark:text-rose-400',
  },
  otro: {
    icon: '📄',
    color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
  },
};

function slugifyType(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\s+/g, '_')
    .replace(/[^a-z0-9_]/g, '');
}

function buildQueryString(params?: ComplaintListParams): string {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }
    searchParams.append(key, String(value));
  });

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function buildReportSummaryQuery(
  params?: ComplaintReportSummaryParams,
): string {
  if (!params) {
    return '';
  }

  const searchParams = new URLSearchParams();

  if (params.from) {
    searchParams.set('from', params.from.toISOString());
  }

  if (params.to) {
    searchParams.set('to', params.to.toISOString());
  }

  if (params.status) {
    searchParams.set('status', params.status);
  }

  if (typeof params.typeId === 'number' && !Number.isNaN(params.typeId)) {
    searchParams.set('typeId', String(params.typeId));
  }

  const query = searchParams.toString();
  return query ? `?${query}` : '';
}

function formatUserName(user: UserSummaryResponse): string {
  const name = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();
  return name.length > 0 ? name : user.username;
}

function normalizeUserRecord(user: UserResponse): User {
  const name = [user.firstName, user.lastName]
    .filter(Boolean)
    .join(' ')
    .trim();

  return {
    id: String(user.id),
    username: user.username,
    firstName: user.firstName,
    lastName: user.lastName,
    role: user.role,
    name: name.length > 0 ? name : user.username,
  };
}

function normalizeArea(area?: AreaResponse | null): AreaSummary | undefined {
  if (!area) {
    return undefined;
  }

  return {
    id: area.id,
    name: area.name,
    isVisible: area.isVisible ?? true,
    areaType: area.areaType
      ? {
          id: area.areaType.id,
          name: area.areaType.name,
        }
      : undefined,
  };
}

function getIncidentVisuals(code: string) {
  return (
    INCIDENT_TYPE_DEFAULTS[code] ?? INCIDENT_TYPE_DEFAULTS['otro']
  );
}

function normalizeIncidentType(type: ComplaintTypeResponse): IncidentType {
  const code =
    type.code && type.code.trim().length > 0
      ? type.code
      : slugifyType(type.name);
  const visuals = getIncidentVisuals(code);

  return {
    id: code,
    backendId: type.id,
    name: type.name,
    description: type.description ?? '',
    derivationAreaId: type.area ? String(type.area.id) : 'none',
    priority: type.defaultPriority ?? 'media',
    icon: type.icon ?? visuals.icon,
    color: type.color ?? visuals.color,
    active: Boolean(type.isVisible),
    autoDerive: Boolean(type.autoDerive),
  };
}

function normalizeComplaint(data: ComplaintResponse): Reclamo {
  const typeInfo = data.type ? normalizeIncidentType(data.type) : undefined;
  const typeCode =
    typeInfo?.id ??
    (data.type?.code && data.type.code.trim().length > 0
      ? data.type.code
      : data.type?.name
      ? slugifyType(data.type.name)
      : 'otro');

  const timeline = Array.isArray(data.timeline)
    ? data.timeline.map((item) => ({
        ...item,
        timestamp: new Date(item.timestamp),
      }))
    : [];

  const location = data.location
    ? {
        lat: data.location.lat,
        lng: data.location.lng,
      }
    : null;

  return {
    id: data.id,
    number: data.number,
    type: typeCode,
    typeLabel: data.type?.name,
    typeInfo,
    description: data.description,
    denunciante: {
      id: String(data.complainant?.id ?? ''),
      name: data.complainant?.name ?? 'Desconocido',
      phone: data.complainant?.phone ?? '',
      address: data.complainant?.address ?? undefined,
    },
    address: data.address,
    location,
    status: data.status,
    priority: data.priority,
    assignedTo: data.assignedTo ? String(data.assignedTo.id) : undefined,
    assignedToName: data.assignedTo
      ? formatUserName(data.assignedTo)
      : undefined,
    derivedTo: data.derivedTo ?? undefined,
    createdAt: new Date(data.createdAt),
    updatedAt: new Date(data.updatedAt),
    attachments: data.attachments ?? [],
    timeline,
  };
}

function normalizeComplaintReportSummary(
  data: ComplaintReportSummaryResponse,
): ReportSummary {
  return {
    range: {
      from: data.range.from,
      to: data.range.to,
    },
    generatedAt: data.generatedAt,
    totals: {
      totalComplaints: data.totals.totalComplaints,
      activeComplaints: data.totals.activeComplaints,
      closedComplaints: data.totals.closedComplaints,
    },
    timeMetrics: {
      averageAssignmentMinutes: data.timeMetrics.averageAssignmentMinutes,
      averageArrivalMinutes: data.timeMetrics.averageArrivalMinutes,
      averageResolutionMinutes: data.timeMetrics.averageResolutionMinutes,
      slaCompliance: data.timeMetrics.slaCompliance,
    },
    agentsInField: data.agentsInField,
    byType: data.byType.map((item) => ({
      typeId: item.typeId,
      typeName: item.typeName,
      total: item.total,
      percentage: item.percentage,
      color: item.color,
    })),
    byStatus: data.byStatus.map((item) => ({
      status: item.status,
      total: item.total,
    })),
    performanceByType: data.performanceByType.map((item) => ({
      typeId: item.typeId,
      typeName: item.typeName,
      averageAssignmentMinutes: item.averageAssignmentMinutes,
      averageArrivalMinutes: item.averageArrivalMinutes,
      slaCompliance: item.slaCompliance,
    })),
    weeklyTrend: data.weeklyTrend.map((item) => ({
      date: item.date,
      created: item.created,
      resolved: item.resolved,
      slaCompliance: item.slaCompliance,
    })),
    heatmap: data.heatmap.map((row) => ({
      hour: row.hour,
      areas: row.areas.map((area) => ({
        areaId: area.areaId,
        areaName: area.areaName,
        total: area.total,
      })),
    })),
  };
}

export interface LoginResponse {
  id: number;
  username: string;
  access_token: string;
}

export interface ProfileResponse {
  id: number;
  username: string;
  firstName: string;
  lastName: string;
  role: 'ADMIN' | 'MANAGER' | 'OPERATOR';
  phone?: string;
}

export async function loginRequest(
  username: string,
  password: string,
): Promise<LoginResponse> {
  return request<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password }),
  });
}

export async function getProfile(token: string): Promise<ProfileResponse> {
  return request<ProfileResponse>('/auth/profile', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export interface CreateUserPayload {
  username: string;
  firstName: string;
  lastName: string;
  password: string;
  role?: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'AGENT';
}

export interface UpdateUserPayload {
  username?: string;
  firstName?: string;
  lastName?: string;
  password?: string;
  role?: 'ADMIN' | 'MANAGER' | 'OPERATOR' | 'AGENT';
}

export async function getUsers(token: string): Promise<User[]> {
  const data = await request<UserResponse[]>('/users', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.map(normalizeUserRecord);
}

export async function createUser(
  token: string,
  payload: CreateUserPayload,
): Promise<User> {
  const body = JSON.stringify(payload);
  const data = await request<UserResponse>('/users', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  return normalizeUserRecord(data);
}

export async function updateUser(
  token: string,
  userId: number,
  payload: UpdateUserPayload,
): Promise<User> {
  const body = JSON.stringify(payload);

  const data = await request<UserResponse>(`/users/${userId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body,
  });

  return normalizeUserRecord(data);
}

export async function deleteUser(
  token: string,
  userId: number,
): Promise<void> {
  await request<void>(
    `/users/${userId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    false,
  );
}

export async function listComplaints(
  token: string,
  params?: ComplaintListParams,
): Promise<Reclamo[]> {
  const query = buildQueryString(params);
  const data = await request<ComplaintResponse[]>(`/complaints${query}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.map(normalizeComplaint);
}

export async function getComplaint(
  token: string,
  id: string,
): Promise<Reclamo> {
  const data = await request<ComplaintResponse>(`/complaints/${id}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return normalizeComplaint(data);
}

export async function createComplaint(
  token: string,
  payload: CreateComplaintPayload,
): Promise<Reclamo> {
  const data = await request<ComplaintResponse>('/complaints', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return normalizeComplaint(data);
}

export async function updateComplaint(
  token: string,
  id: string,
  payload: UpdateComplaintPayload,
): Promise<Reclamo> {
  const data = await request<ComplaintResponse>(`/complaints/${id}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return normalizeComplaint(data);
}

export async function getComplaintReportSummary(
  token: string,
  params?: ComplaintReportSummaryParams,
): Promise<ReportSummary> {
  const query = buildReportSummaryQuery(params);
  const data = await request<ComplaintReportSummaryResponse>(
    `/complaints/reports/summary${query}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return normalizeComplaintReportSummary(data);
}

export async function getComplaintTypes(
  token: string,
): Promise<IncidentType[]> {
  const data = await request<ComplaintTypeResponse[]>('/complaint-types', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.map(normalizeIncidentType);
}

export interface CreateIncidentTypePayload {
  name: string;
  description: string;
  defaultPriority: 'alta' | 'media' | 'baja';
  areaId?: number | null;
  code?: string;
  isVisible?: boolean;
  autoDerive?: boolean;
  icon?: string;
  color?: string;
}

export type UpdateIncidentTypePayload = Partial<CreateIncidentTypePayload>;

export async function createIncidentType(
  token: string,
  payload: CreateIncidentTypePayload,
): Promise<IncidentType> {
  const data = await request<ComplaintTypeResponse>('/complaint-types', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  return normalizeIncidentType(data);
}

export async function updateIncidentType(
  token: string,
  incidentId: number,
  payload: UpdateIncidentTypePayload,
): Promise<IncidentType> {
  const data = await request<ComplaintTypeResponse>(
    `/complaint-types/${incidentId}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    },
  );

  return normalizeIncidentType(data);
}

export async function deleteIncidentType(
  token: string,
  incidentId: number,
): Promise<void> {
  await request<void>(
    `/complaint-types/${incidentId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    false,
  );
}

export async function getAreas(token: string): Promise<AreaSummary[]> {
  const data = await request<AreaResponse[]>('/areas', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data
    .map((area) => normalizeArea(area))
    .filter((area): area is AreaSummary => Boolean(area));
}

export interface CreateAreaPayload {
  name: string;
  isVisible?: boolean;
  areaTypeId?: number | null;
}

export type UpdateAreaPayload = Partial<CreateAreaPayload>;

export async function createArea(
  token: string,
  payload: CreateAreaPayload,
): Promise<AreaSummary> {
  const data = await request<AreaResponse>('/areas', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const area = normalizeArea(data);
  if (!area) {
    throw new ApiError('Área inválida retornada por el servidor', 500, data);
  }

  return area;
}

export async function updateArea(
  token: string,
  areaId: number,
  payload: UpdateAreaPayload,
): Promise<AreaSummary> {
  const data = await request<AreaResponse>(`/areas/${areaId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(payload),
  });

  const area = normalizeArea(data);
  if (!area) {
    throw new ApiError('Área inválida retornada por el servidor', 500, data);
  }

  return area;
}

export async function deleteArea(
  token: string,
  areaId: number,
): Promise<void> {
  await request<void>(
    `/areas/${areaId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    false,
  );
}

interface WhatsappMessageMediaResponse {
  mimetype: string;
  data: string;
  fileName: string | null;
  fileSize: number | null;
  durationSeconds: number | null;
}

interface WhatsappMessageResponse {
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
  media?: WhatsappMessageMediaResponse | null;
}

interface WhatsappConversationResponse {
  id: string;
  displayName: string;
  number: string | null;
  isGroup: boolean;
  unreadCount: number;
  archived: boolean;
  muted: boolean;
  lastMessage: WhatsappMessageResponse | null;
  updatedAt: string | null;
}

interface WhatsappMessagesResponsePayload {
  chat: WhatsappConversationResponse;
  messages: WhatsappMessageResponse[];
  nextCursor: string | null;
  hasMore: boolean;
}

function parseIsoDate(value: string | null | undefined): Date | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function normalizeWhatsappMessage(
  payload: WhatsappMessageResponse,
): WhatsappChatMessage {
  const media =
    payload.media && payload.media.data && payload.media.mimetype
      ? {
          data: payload.media.data,
          mimetype: payload.media.mimetype,
          fileName: payload.media.fileName ?? null,
          fileSize:
            typeof payload.media.fileSize === 'number' && Number.isFinite(payload.media.fileSize)
              ? payload.media.fileSize
              : null,
          durationSeconds:
            typeof payload.media.durationSeconds === 'number' &&
            Number.isFinite(payload.media.durationSeconds)
              ? payload.media.durationSeconds
              : null,
        }
      : null;

  return {
    id: payload.id,
    chatId: payload.chatId,
    body: payload.body,
    fromMe: payload.fromMe,
    senderId: payload.senderId,
    senderName: payload.senderName,
    timestamp: parseIsoDate(payload.timestamp) ?? new Date(),
    type: payload.type,
    hasMedia: payload.hasMedia,
    ack: payload.ack ?? null,
    media,
  };
}

function normalizeWhatsappConversation(
  payload: WhatsappConversationResponse,
): WhatsappConversationSummary {
  return {
    id: payload.id,
    displayName: payload.displayName,
    number: payload.number,
    isGroup: payload.isGroup,
    unreadCount: payload.unreadCount ?? 0,
    archived: payload.archived ?? false,
    muted: payload.muted ?? false,
    lastMessage: payload.lastMessage
      ? normalizeWhatsappMessage(payload.lastMessage)
      : null,
    updatedAt: parseIsoDate(payload.updatedAt),
  };
}

function normalizeWhatsappMessages(
  payload: WhatsappMessagesResponsePayload,
): WhatsappMessagesResult {
  return {
    chat: normalizeWhatsappConversation(payload.chat),
    messages: payload.messages.map(normalizeWhatsappMessage),
    nextCursor: payload.nextCursor,
    hasMore: payload.hasMore,
  };
}

export async function getWhatsappStatus(token: string): Promise<WhatsappStatus> {
  return request<WhatsappStatus>('/whatsapp/status', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function connectWhatsapp(token: string): Promise<WhatsappStatus> {
  return request<WhatsappStatus>('/whatsapp/connect', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function logoutWhatsapp(token: string): Promise<WhatsappStatus> {
  return request<WhatsappStatus>('/whatsapp/logout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export async function listWhatsappChats(
  token: string,
): Promise<WhatsappConversationSummary[]> {
  const data = await request<WhatsappConversationResponse[]>('/whatsapp/chats', {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  return data.map(normalizeWhatsappConversation);
}

export async function getWhatsappChat(
  token: string,
  chatId: string,
): Promise<WhatsappConversationSummary> {
  const encodedId = encodeURIComponent(chatId);
  const data = await request<WhatsappConversationResponse>(
    `/whatsapp/chats/${encodedId}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return normalizeWhatsappConversation(data);
}

interface WhatsappMessageListParams {
  limit?: number;
}

export async function getWhatsappMessages(
  token: string,
  chatId: string,
  params?: WhatsappMessageListParams,
): Promise<WhatsappMessagesResult> {
  const query =
    params?.limit && Number.isFinite(params.limit)
      ? `?limit=${encodeURIComponent(String(params.limit))}`
      : '';

  const encodedId = encodeURIComponent(chatId);
  const data = await request<WhatsappMessagesResponsePayload>(
    `/whatsapp/chats/${encodedId}/messages${query}`,
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  return normalizeWhatsappMessages(data);
}

export async function sendWhatsappMessage(
  token: string,
  chatId: string,
  message: string,
): Promise<WhatsappChatMessage> {
  const encodedId = encodeURIComponent(chatId);
  const data = await request<WhatsappMessageResponse>(
    `/whatsapp/chats/${encodedId}/messages`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ message }),
    },
  );

  return normalizeWhatsappMessage(data);
}

export async function markWhatsappChatRead(
  token: string,
  chatId: string,
): Promise<void> {
  const encodedId = encodeURIComponent(chatId);
  await request<void>(
    `/whatsapp/chats/${encodedId}/read`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
    false,
  );
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}
