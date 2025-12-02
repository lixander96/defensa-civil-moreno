import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatTime(date: Date): string {
  return date.toLocaleTimeString('es-AR', { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: false
  });
}

export function formatDate(date: Date): string {
  return date.toLocaleDateString('es-AR', {
    day: '2-digit',
    month: '2-digit', 
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

export function getRelativeTime(date: Date): string {
  const now = new Date();
  const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
  
  if (diffInMinutes < 1) return 'Ahora';
  if (diffInMinutes < 60) return `${diffInMinutes}m`;
  
  const diffInHours = Math.floor(diffInMinutes / 60);
  if (diffInHours < 24) return `${diffInHours}h`;
  
  const diffInDays = Math.floor(diffInHours / 24);
  return `${diffInDays}d`;
}

export function getWaitingMinutes(createdAt: Date): number {
  const now = new Date();
  return Math.floor((now.getTime() - createdAt.getTime()) / (1000 * 60));
}

export function getSLAStatus(waitingMinutes: number, priority?: 'alta' | 'media' | 'baja'): {
  status: 'good' | 'warning' | 'critical';
  color: string;
} {
  // SLA targets based on priority
  const slaTargets = {
    alta: 15,    // 15 minutes for high priority
    media: 30,   // 30 minutes for medium priority  
    baja: 60     // 60 minutes for low priority
  };
  
  const target = slaTargets[priority || 'media'];
  const percentage = (waitingMinutes / target) * 100;
  
  if (percentage <= 70) {
    return { status: 'good', color: 'text-green-600 dark:text-green-400' };
  } else if (percentage <= 90) {
    return { status: 'warning', color: 'text-amber-600 dark:text-amber-400' };
  } else {
    return { status: 'critical', color: 'text-red-600 dark:text-red-400' };
  }
}

export function getReclamoTypeInfo(type?: string): {
  label: string;
  icon: string;
  color: string;
} {
  switch (type) {
    case 'incendio':
      return {
        label: 'Incendio',
        icon: '🔥',
        color: 'text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950'
      };
    case 'poste_caido':
      return {
        label: 'Poste Caído',
        icon: '⚡',
        color: 'text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-950'
      };
    case 'fuga_gas':
      return {
        label: 'Fuga de Gas',
        icon: '💨',
        color: 'text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-950'
      };
    case 'inundacion':
      return {
        label: 'Inundación',
        icon: '🌊',
        color: 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950'
      };
    default:
      return {
        label: 'Otro',
        icon: '📋',
        color: 'text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-950'
      };
  }
}

export function getTypeLabel(type: string): string {
  const typeInfo = getReclamoTypeInfo(type);
  return typeInfo.label;
}

export function getStatusLabel(status: string): string {
  switch (status) {
    case 'nuevo':
      return 'Nuevo';
    case 'abierto':
      return 'Abierto';
    case 'derivado':
      return 'Derivado';
    case 'enviado':
      return 'Enviado';
    case 'en_camino':
      return 'En Camino';
    case 'verificado':
      return 'Verificado';
    case 'cerrado':
      return 'Cerrado';
    default:
      return status;
  }
}

export function getStatusColor(status: string): string {
  switch (status) {
    case 'nuevo':
      return 'bg-red-500 text-white'; // Rojo (alarma)
    case 'abierto':
      return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
    case 'derivado':
      return 'bg-amber-500 text-white'; // Ámbar (pendiente)
    case 'enviado':
      return 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300';
    case 'en_camino':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
    case 'verificado':
      return 'bg-green-500 text-white'; // Verde (resuelto)
    case 'cerrado':
      return 'bg-gray-500 text-white'; // Gris (cerrado)
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300';
  }
}

export function getPriorityColor(priority: string): string {
  switch (priority) {
    case 'alta':
      return 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900 dark:text-red-300 dark:border-red-700';
    case 'media':
      return 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900 dark:text-amber-300 dark:border-amber-700';
    case 'baja':
      return 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900 dark:text-green-300 dark:border-green-700';
    default:
      return 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-900 dark:text-gray-300 dark:border-gray-700';
  }
}

export function inferReclamoType(messageContent: string): string {
  const content = messageContent.toLowerCase();
  
  if (content.includes('incendio') || content.includes('fuego') || content.includes('humo')) {
    return 'incendio';
  }
  if (content.includes('poste') || content.includes('cable') || content.includes('luz')) {
    return 'poste_caido';
  }
  if (content.includes('gas') || content.includes('olor')) {
    return 'fuga_gas';
  }
  if (content.includes('agua') || content.includes('inundac') || content.includes('aneg')) {
    return 'inundacion';
  }
  
  return 'otro';
}