import React from 'react';
import { TicketPriority, TicketStatus } from '../../types';

interface StatusBadgeProps {
  status: TicketStatus;
  size?: 'sm' | 'md' | 'lg';
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status, size = 'md' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-xs font-medium',
    lg: 'px-3.5 py-1.5 text-sm font-semibold',
  };

  switch (status) {
    case 'abierto':
      return (
        <span
          id={`status-badge-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200/80 shadow-xs ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse" />
          Abierto
        </span>
      );
    case 'en_progreso':
      return (
        <span
          id={`status-badge-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full bg-amber-50 text-amber-800 border border-amber-200/80 shadow-xs ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
          En Progreso
        </span>
      );
    case 'resuelto':
      return (
        <span
          id={`status-badge-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
          Resuelto
        </span>
      );
    case 'cerrado':
      return (
        <span
          id={`status-badge-${status}`}
          className={`inline-flex items-center gap-1.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 shadow-xs ${sizeClasses[size]}`}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-slate-400" />
          Cerrado
        </span>
      );
    default:
      return null;
  }
};

interface PriorityBadgeProps {
  priority: TicketPriority;
  size?: 'sm' | 'md';
}

export const PriorityBadge: React.FC<PriorityBadgeProps> = ({ priority, size = 'sm' }) => {
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[11px] font-medium',
    md: 'px-2.5 py-1 text-xs font-semibold',
  };

  switch (priority) {
    case 'urgente':
      return (
        <span
          id={`priority-badge-${priority}`}
          className={`inline-flex items-center rounded-md bg-red-600 text-white font-bold tracking-wide uppercase shadow-xs ${sizeClasses[size]}`}
        >
          Urgente
        </span>
      );
    case 'alta':
      return (
        <span
          id={`priority-badge-${priority}`}
          className={`inline-flex items-center rounded-md bg-orange-100 text-orange-800 border border-orange-200 ${sizeClasses[size]}`}
        >
          Alta
        </span>
      );
    case 'media':
      return (
        <span
          id={`priority-badge-${priority}`}
          className={`inline-flex items-center rounded-md bg-blue-50 text-blue-700 border border-blue-200 ${sizeClasses[size]}`}
        >
          Media
        </span>
      );
    case 'baja':
      return (
        <span
          id={`priority-badge-${priority}`}
          className={`inline-flex items-center rounded-md bg-slate-100 text-slate-600 border border-slate-200 ${sizeClasses[size]}`}
        >
          Baja
        </span>
      );
    default:
      return null;
  }
};
