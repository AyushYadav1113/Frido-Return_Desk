'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import ApprovalDialog from './ApprovalDialog';
import { ArrowRight, CheckCircle2, XCircle, Trash2, Edit2, Check } from 'lucide-react';

interface RequestActionsProps {
  request: {
    id: string;
    status: string;
  };
  onUpdate: (updatedRequest: any) => void;
}

export default function RequestActions({ request, onUpdate }: RequestActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  
  const [isApproveOpen, setIsApproveOpen] = useState(false);
  const [showConfirmRemove, setShowConfirmRemove] = useState(false);

  const handleStatusTransition = async (targetStatus: string) => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/requests/${request.id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error?.message || `Failed to transition status to ${targetStatus}`);
        setLoading(false);
        return;
      }

      setSuccessMsg(`Status updated to ${targetStatus.replace('_', ' ')}.`);
      onUpdate(data);
      setLoading(false);
      
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg('Network error. Unable to perform status update.');
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    setLoading(true);
    setErrorMsg(null);
    setSuccessMsg(null);

    try {
      const res = await fetch(`/api/requests/${request.id}`, {
        method: 'DELETE',
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error?.message || 'Failed to remove return request.');
        setLoading(false);
        return;
      }

      setSuccessMsg('Return request removed successfully.');
      setTimeout(() => {
        router.push('/requests');
        router.refresh();
      }, 1500);
    } catch (err) {
      setErrorMsg('Network error. Unable to remove request.');
      setLoading(false);
    }
  };

  const renderActions = () => {
    switch (request.status) {
      case 'OPEN':
        return (
          <>
            <button
              onClick={() => handleStatusTransition('IN_REVIEW')}
              disabled={loading}
              className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow flex items-center gap-1.5 transition-all text-sm active:scale-[0.98]"
            >
              Move to In Review
              <ArrowRight className="w-4 h-4" />
            </button>
            <Link
              href={`/requests/${request.id}/edit`}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              Edit details
            </Link>
            <button
              onClick={() => setShowConfirmRemove(true)}
              disabled={loading}
              className="border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center gap-1.5"
            >
              <Trash2 className="w-4 h-4" />
              Remove request
            </button>
          </>
        );
      case 'IN_REVIEW':
        return (
          <>
            <button
              onClick={() => setIsApproveOpen(true)}
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow flex items-center gap-1.5 transition-all text-sm active:scale-[0.98]"
            >
              <CheckCircle2 className="w-4 h-4" />
              Approve return
            </button>
            <button
              onClick={() => handleStatusTransition('REJECTED')}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow flex items-center gap-1.5 transition-all text-sm active:scale-[0.98]"
            >
              <XCircle className="w-4 h-4" />
              Reject return
            </button>
            <Link
              href={`/requests/${request.id}/edit`}
              className="border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center gap-1.5"
            >
              <Edit2 className="w-4 h-4" />
              Edit details
            </Link>
          </>
        );
      case 'APPROVED':
        return (
          <button
            onClick={() => handleStatusTransition('COMPLETED')}
            disabled={loading}
            className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg shadow-sm hover:shadow flex items-center gap-1.5 transition-all text-sm active:scale-[0.98]"
          >
            <Check className="w-4 h-4" />
            Complete return
          </button>
        );
      case 'REJECTED':
        return (
          <button
            onClick={() => setShowConfirmRemove(true)}
            disabled={loading}
            className="border border-rose-300 hover:bg-rose-50 text-rose-700 font-semibold py-2 px-4 rounded-lg transition-all text-sm flex items-center gap-1.5"
          >
            <Trash2 className="w-4 h-4" />
            Remove request
          </button>
        );
      case 'COMPLETED':
      default:
        return null;
    }
  };

  const actionElements = renderActions();

  if (!actionElements && !showConfirmRemove && !successMsg && !errorMsg) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider mb-2">Workflow Actions</h3>

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-3 text-xs font-semibold">
          {successMsg}
        </div>
      )}

      {errorMsg && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-3 text-xs font-semibold">
          {errorMsg}
        </div>
      )}

      {showConfirmRemove ? (
        <div className="bg-rose-50 border border-rose-100 rounded-xl p-4 space-y-3">
          <p className="text-sm text-rose-800 font-semibold">
            Are you sure you want to remove this request? This action cannot be undone.
          </p>
          <div className="flex items-center gap-2">
            <button
              onClick={handleRemove}
              disabled={loading}
              className="bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold py-1.5 px-3 rounded"
            >
              Yes, remove
            </button>
            <button
              onClick={() => setShowConfirmRemove(false)}
              disabled={loading}
              className="bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold py-1.5 px-3 rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          {actionElements}
        </div>
      )}

      <ApprovalDialog
        requestId={request.id}
        isOpen={isApproveOpen}
        onClose={() => setIsApproveOpen(false)}
        onSuccess={onUpdate}
      />
    </div>
  );
}
