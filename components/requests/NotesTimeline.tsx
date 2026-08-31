'use client';

import React, { useState } from 'react';
import { Send, AlertCircle, MessageSquare } from 'lucide-react';

interface Note {
  id: string;
  content: string;
  createdAt: string | Date;
}

interface NotesTimelineProps {
  requestId: string;
  notes: Note[];
  onAddNote: (newNote: Note) => void;
}

export default function NotesTimeline({ requestId, notes, onAddNote }: NotesTimelineProps) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/requests/${requestId}/notes`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error?.message || 'Failed to add note.');
        setLoading(false);
        return;
      }

      setContent('');
      setSuccessMsg('Note added successfully.');
      onAddNote(data);
      setLoading(false);
      setTimeout(() => setSuccessMsg(null), 3000);

    } catch (err) {
      setErrorMsg('Network error. Unable to add note.');
      setLoading(false);
    }
  };

  const formatNoteTime = (dateStr: string | Date) => {
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
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5 border-b border-slate-100 pb-3">
        <MessageSquare className="w-4 h-4 text-slate-400" />
        Activity Timeline ({notes.length})
      </h3>

      <form onSubmit={handleSubmit} className="space-y-3">
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-lg p-2.5 text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-emerald-50 border border-emerald-100 text-emerald-800 rounded-lg p-2.5 text-xs font-semibold">
            {successMsg}
          </div>
        )}

        <div className="relative">
          <textarea
            rows={3}
            className="block w-full border border-slate-300 rounded-lg p-3 text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
            placeholder="Add internal log or notes..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            disabled={loading}
            required
          />
        </div>

        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || !content.trim()}
            className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-slate-100 disabled:text-slate-400 text-white font-semibold py-2 px-4 rounded-lg shadow-sm text-xs transition-all flex items-center gap-1.5 active:scale-[0.98]"
          >
            <Send className="w-3 h-3" />
            {loading ? 'Adding...' : 'Add Note'}
          </button>
        </div>
      </form>

      {notes.length === 0 ? (
        <div className="text-center py-6 text-slate-400 text-sm">
          No notes on this request yet.
        </div>
      ) : (
        <div className="relative border-l border-slate-200 ml-3 pl-5 space-y-6">
          {notes.map((note) => (
            <div key={note.id} className="relative group">
              <span className="absolute -left-[26px] top-1.5 bg-white border-2 border-indigo-500 w-3 h-3 rounded-full flex items-center justify-center group-hover:border-indigo-600 transition-colors" />
              
              <div className="space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-indigo-600">Support Staff Note</span>
                  <span className="text-xs text-slate-400">{formatNoteTime(note.createdAt)}</span>
                </div>
                <p className="text-sm text-slate-700 font-medium bg-slate-50 border border-slate-100 rounded-lg p-3 whitespace-pre-wrap leading-relaxed shadow-sm">
                  {note.content}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
