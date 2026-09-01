'use client';

import React from 'react';
import {
  FilePlus,
  RefreshCw,
  Edit3,
  MessageSquare,
  ShieldCheck,
  Trash2,
  Clock,
} from 'lucide-react';

export interface Activity {
  id: string;
  type:
    | 'REQUEST_CREATED'
    | 'STATUS_CHANGED'
    | 'REQUEST_UPDATED'
    | 'NOTE_ADDED'
    | 'RESOLUTION_SET'
    | 'REQUEST_REMOVED';
  description: string;
  metadata?: any;
  createdAt: string | Date;
}

interface ActivityTimelineProps {
  activities: Activity[];
}

const TYPE_CONFIG = {
  REQUEST_CREATED: {
    label: 'Request Created',
    icon: FilePlus,
    badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    nodeColor: 'border-emerald-500 bg-emerald-50 text-emerald-600',
  },
  STATUS_CHANGED: {
    label: 'Status Changed',
    icon: RefreshCw,
    badgeBg: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    nodeColor: 'border-indigo-500 bg-indigo-50 text-indigo-600',
  },
  RESOLUTION_SET: {
    label: 'Resolution Selected',
    icon: ShieldCheck,
    badgeBg: 'bg-purple-50 text-purple-700 border-purple-200',
    nodeColor: 'border-purple-500 bg-purple-50 text-purple-600',
  },
  NOTE_ADDED: {
    label: 'Note Added',
    icon: MessageSquare,
    badgeBg: 'bg-sky-50 text-sky-700 border-sky-200',
    nodeColor: 'border-sky-500 bg-sky-50 text-sky-600',
  },
  REQUEST_UPDATED: {
    label: 'Request Updated',
    icon: Edit3,
    badgeBg: 'bg-amber-50 text-amber-700 border-amber-200',
    nodeColor: 'border-amber-500 bg-amber-50 text-amber-600',
  },
  REQUEST_REMOVED: {
    label: 'Request Removed',
    icon: Trash2,
    badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
    nodeColor: 'border-rose-500 bg-rose-50 text-rose-600',
  },
};

export default function ActivityTimeline({ activities }: ActivityTimelineProps) {
  const formatTime = (dateStr: string | Date) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-6">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-4 h-4 text-slate-400" />
          Activity Timeline ({activities.length})
        </h3>
        <span className="text-[11px] font-medium text-slate-400 bg-slate-50 border border-slate-100 rounded px-2 py-0.5">
          Immutable Audit Log
        </span>
      </div>

      {activities.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          No system activity recorded yet.
        </div>
      ) : (
        <div className="relative border-l border-slate-200 ml-3 pl-6 space-y-6">
          {activities.map((activity) => {
            const config = TYPE_CONFIG[activity.type] || {
              label: activity.type.replace('_', ' '),
              icon: Clock,
              badgeBg: 'bg-slate-50 text-slate-700 border-slate-200',
              nodeColor: 'border-slate-400 bg-slate-50 text-slate-500',
            };
            const Icon = config.icon;

            return (
              <div key={activity.id} className="relative group">
                {/* Node icon marker */}
                <div
                  className={`absolute -left-[37px] top-0 w-6 h-6 rounded-full border-2 flex items-center justify-center shadow-xs transition-transform group-hover:scale-110 ${config.nodeColor}`}
                >
                  <Icon className="w-3 h-3" />
                </div>

                <div className="space-y-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-semibold border ${config.badgeBg}`}
                    >
                      {config.label}
                    </span>
                    <span className="text-xs text-slate-400 font-medium">
                      {formatTime(activity.createdAt)}
                    </span>
                  </div>

                  <p className="text-sm text-slate-800 font-semibold pt-0.5">
                    {activity.description}
                  </p>

                  {/* Metadata Context Badge */}
                  {activity.metadata && typeof activity.metadata === 'object' && (
                    <div className="pt-1 flex flex-wrap gap-1.5 text-xs text-slate-500">
                      {activity.metadata.from && activity.metadata.to && (
                        <span className="inline-flex items-center gap-1 bg-slate-100 text-slate-700 rounded px-2 py-0.5 font-medium text-[11px]">
                          <span>{activity.metadata.from}</span>
                          <span>&rarr;</span>
                          <span className="font-bold">{activity.metadata.to}</span>
                        </span>
                      )}

                      {activity.metadata.fields && Array.isArray(activity.metadata.fields) && (
                        <span className="bg-amber-50 text-amber-800 border border-amber-100 rounded px-2 py-0.5 text-[11px] font-medium">
                          Fields changed: {activity.metadata.fields.join(', ')}
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
