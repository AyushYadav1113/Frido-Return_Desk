'use client';

import React, { useState } from 'react';
import { AlertCircle } from 'lucide-react';

interface ApprovalDialogProps {
  requestId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedRequest: any) => void;
}

export default function ApprovalDialog({ requestId, isOpen, onClose, onSuccess }: ApprovalDialogProps) {
  const [resolution, setResolution] = useState<'REFUND' | 'REPLACEMENT' | 'STORE_CREDIT'>('REFUND');
  const [refundAmount, setRefundAmount] = useState<string>('');
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [amountError, setAmountError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg(null);
    setAmountError(null);

    if (resolution === 'REFUND') {
      const amountNum = Number(refundAmount);
      if (!refundAmount || isNaN(amountNum) || amountNum <= 0) {
        setAmountError('Refund amount must be a positive number greater than 0.');
        setLoading(false);
        return;
      }
    }

    try {
      const payload = {
        status: 'APPROVED',
        resolution,
        refundAmount: resolution === 'REFUND' ? Number(refundAmount) : null,
      };

      const res = await fetch(`/api/requests/${requestId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error?.message || 'Failed to approve return request.');
        setLoading(false);
        return;
      }

      onSuccess(data);
      onClose();
    } catch (err) {
      setErrorMsg('Network error. Unable to complete transaction.');
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" role="dialog" aria-modal="true">
      <div className="bg-white border border-slate-200 rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        <header className="bg-slate-50 border-b border-slate-100 px-6 py-4">
          <h3 className="font-bold text-slate-800 text-lg">Approve Return Request</h3>
        </header>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMsg && (
            <div className="bg-rose-50 border border-rose-100 text-rose-800 rounded-lg p-3 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <div>
            <label htmlFor="resolution" className="block text-sm font-semibold text-slate-700 mb-1">Resolution *</label>
            <select
              id="resolution"
              className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 font-medium"
              value={resolution}
              onChange={(e) => {
                setResolution(e.target.value as any);
                setRefundAmount('');
                setAmountError(null);
              }}
            >
              <option value="REFUND">Refund</option>
              <option value="REPLACEMENT">Replacement</option>
              <option value="STORE_CREDIT">Store Credit</option>
            </select>
          </div>

          {resolution === 'REFUND' && (
            <div>
              <label htmlFor="refundAmount" className="block text-sm font-semibold text-slate-700 mb-1">Refund Amount *</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-slate-400 font-semibold">$</span>
                <input
                  id="refundAmount"
                  type="number"
                  step="0.01"
                  min="0.01"
                  className={`block w-full pl-7 pr-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 ${
                    amountError ? 'border-rose-300 ring-rose-100 ring-2' : 'border-slate-300'
                  }`}
                  placeholder="0.00"
                  value={refundAmount}
                  onChange={(e) => {
                    setRefundAmount(e.target.value);
                    setAmountError(null);
                  }}
                  required
                />
              </div>
              {amountError && <p className="text-xs text-rose-600 mt-1 font-semibold">{amountError}</p>}
            </div>
          )}

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 mt-6">
            <button
              type="button"
              className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm active:scale-[0.98]"
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Confirm Approval'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
