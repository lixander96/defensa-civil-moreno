export enum ComplaintStatus {
  OPEN = 'abierto',
  DERIVED = 'derivado',
  IN_ROUTE = 'en_camino',
  VERIFIED = 'verificado',
  CLOSED = 'cerrado',
}

export enum ComplaintPriority {
  HIGH = 'alta',
  MEDIUM = 'media',
  LOW = 'baja',
}

export type ComplaintTimelineType =
  | 'created'
  | 'assigned'
  | 'derived'
  | 'in_route'
  | 'verified'
  | 'closed'
  | 'message';

export interface ComplaintTimelineEntry {
  id: string;
  type: ComplaintTimelineType;
  description: string;
  user: string;
  timestamp: string;
  data?: Record<string, any>;
}
