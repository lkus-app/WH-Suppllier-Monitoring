import React from 'react';
import { POStatus, BookingStatus, PriorityLevel } from '../../types';

interface StatusBadgeProps {
  status: POStatus | BookingStatus | PriorityLevel | string;
  type?: 'po' | 'booking' | 'priority' | 'generic';
  className?: string;
  showDot?: boolean;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  type = 'generic',
  className = '',
  showDot = true,
}) => {
  const normalized = (status || '').toString().toUpperCase();

  let label = normalized.replace(/_/g, ' ');
  let styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
  let dotColor = 'bg-slate-400';
  let pulse = false;

  // Custom mapping matching Design Tokens
  if (normalized === 'DRAFT' || normalized === 'WAITING_PPIC_REVIEW' || normalized === 'PENDING') {
    label = normalized === 'WAITING_PPIC_REVIEW' ? 'Waiting Review' : normalized;
    styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-400';
  } else if (
    normalized === 'READY_FOR_BOOKING' ||
    normalized === 'PPIC_APPROVED' ||
    normalized === 'APPROVED' ||
    normalized === 'AVAILABLE'
  ) {
    label = normalized === 'READY_FOR_BOOKING' || normalized === 'PPIC_APPROVED' ? 'Ready for Booking' : 'Available';
    styleClasses = 'bg-emerald-50 text-emerald-700 border-emerald-200';
    dotColor = 'bg-emerald-500';
  } else if (
    normalized === 'BOOKED' ||
    normalized === 'SCHEDULED' ||
    normalized === 'CONFIRMED'
  ) {
    label = 'Booked / Scheduled';
    styleClasses = 'bg-blue-50 text-blue-700 border-blue-200';
    dotColor = 'bg-blue-500';
  } else if (
    normalized === 'GATE_IN' ||
    normalized === 'ARRIVED' ||
    normalized === 'CHECKED_IN'
  ) {
    label = 'Gate In / Yard';
    styleClasses = 'bg-indigo-50 text-indigo-700 border-indigo-200';
    dotColor = 'bg-indigo-500';
  } else if (
    normalized === 'UNLOADING' ||
    normalized === 'IN_PROGRESS' ||
    normalized === 'ACTIVE'
  ) {
    label = 'Unloading (Live)';
    styleClasses = 'bg-amber-50 text-amber-700 border-amber-200';
    dotColor = 'bg-amber-500';
    pulse = true;
  } else if (
    normalized === 'COMPLETED' ||
    normalized === 'GATE_OUT' ||
    normalized === 'SELESAI'
  ) {
    label = 'Completed';
    styleClasses = 'bg-slate-100 text-slate-700 border-slate-200';
    dotColor = 'bg-slate-500';
  } else if (
    normalized === 'URGENT' ||
    normalized === 'OVERDUE' ||
    normalized === 'REJECTED' ||
    normalized === 'CANCELLED' ||
    normalized === 'EXPIRED'
  ) {
    label = normalized;
    styleClasses = 'bg-rose-50 text-rose-700 border-rose-200';
    dotColor = 'bg-rose-500';
  } else if (normalized === 'HIGH') {
    label = 'High Priority';
    styleClasses = 'bg-orange-50 text-orange-700 border-orange-200';
    dotColor = 'bg-orange-500';
  } else if (normalized === 'NORMAL' || normalized === 'LOW') {
    label = 'Normal';
    styleClasses = 'bg-slate-100 text-slate-600 border-slate-200';
    dotColor = 'bg-slate-400';
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${styleClasses} ${className}`}
    >
      {showDot && (
        <span
          className={`w-1.5 h-1.5 rounded-full ${dotColor} ${
            pulse ? 'animate-ping' : ''
          }`}
        />
      )}
      <span className="truncate">{label}</span>
    </span>
  );
};
