import React from 'react';

const STATUS_STYLES: Record<string, { bg: string; text: string; label: string; border: string }> = {
  OPEN: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    label: 'Open',
  },
  IN_REVIEW: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    label: 'In Review',
  },
  APPROVED: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    label: 'Approved',
  },
  REJECTED: {
    bg: 'bg-rose-50',
    text: 'text-rose-700',
    border: 'border-rose-200',
    label: 'Rejected',
  },
  COMPLETED: {
    bg: 'bg-slate-100',
    text: 'text-slate-700',
    border: 'border-slate-300',
    label: 'Completed',
  },
};

interface RequestStatusBadgeProps {
  status: string;
}

export default function RequestStatusBadge({ status }: RequestStatusBadgeProps) {
  const style = STATUS_STYLES[status] || {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    label: status,
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${style.bg} ${style.text} ${style.border}`}
      aria-label={`Status: ${style.label}`}
    >
      <span className="w-1.5 h-1.5 rounded-full bg-current" aria-hidden="true" />
      {style.label}
    </span>
  );
}
