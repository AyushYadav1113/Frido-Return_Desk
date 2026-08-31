'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequestStatusBadge from '@/components/requests/RequestStatusBadge';
import RequestActions from '@/components/requests/RequestActions';
import NotesTimeline from '@/components/requests/NotesTimeline';
import { ArrowLeft, Loader2, Calendar, User, Package, ShieldCheck, AlertCircle } from 'lucide-react';

interface RequestDetailsProps {
  params: {
    id: string;
  };
}

const REASON_LABELS: Record<string, string> = {
  DAMAGED: 'Damaged',
  WRONG_ITEM: 'Wrong Item',
  SIZE_ISSUE: 'Size Issue',
  NOT_AS_DESCRIBED: 'Not As Described',
  CHANGED_MIND: 'Changed Mind',
};

const RESOLUTION_LABELS: Record<string, string> = {
  REFUND: 'Refund',
  REPLACEMENT: 'Replacement',
  STORE_CREDIT: 'Store Credit',
};

export default function RequestDetailsPage({ params }: RequestDetailsProps) {
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const fetchRequestDetails = React.useCallback(async () => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const res = await fetch(`/api/requests/${requestId}`);
      const data = await res.json();

      if (!res.ok) {
        setErrorMsg(data?.error?.message || 'Failed to load return request details.');
        setLoading(false);
        return;
      }

      setRequest(data);
    } catch (err) {
      setErrorMsg('Network error. Unable to load details.');
    } finally {
      setLoading(false);
    }
  }, [requestId]);

  useEffect(() => {
    fetchRequestDetails();
  }, [requestId, fetchRequestDetails]);

  const handleUpdate = (updatedRequest: any) => {
    setRequest(updatedRequest);
  };

  const handleAddNote = (newNote: any) => {
    if (request) {
      setRequest({
        ...request,
        notes: [...request.notes, newNote],
      });
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-32">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
        <p className="text-slate-500 text-sm font-medium">Loading return request details...</p>
      </div>
    );
  }

  if (errorMsg || !request) {
    return (
      <div className="max-w-md mx-auto py-16 text-center space-y-4">
        <div className="inline-flex p-3 rounded-full bg-rose-50 border border-rose-100 text-rose-600 mb-2">
          <AlertCircle className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-slate-800">Request Not Found</h2>
        <p className="text-slate-500 text-sm">{errorMsg || 'The requested return request may have been removed.'}</p>
        <Link
          href="/requests"
          className="inline-flex items-center gap-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-all shadow-sm active:scale-[0.98]"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div className="space-y-1">
          <Link
            href="/requests"
            className="text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 mb-2 group"
          >
            <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Dashboard
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <span className="font-mono text-base font-semibold text-slate-500 bg-slate-100 border border-slate-200 rounded px-2.5 py-0.5">
              {request.reference}
            </span>
            <RequestStatusBadge status={request.status} />
          </div>
          <p className="text-xs text-slate-400">ID: {request.id}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Customer details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <User className="w-4 h-4 text-slate-400" />
                  Customer Details
                </h4>
                <div className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs block">Name</span>
                    <span className="font-semibold text-slate-800">{request.customerName}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Email</span>
                    <span className="font-semibold text-slate-800 select-all">{request.customerEmail}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Phone</span>
                    <span className="font-semibold text-slate-800">{request.customerPhone || 'Not provided'}</span>
                  </div>
                </div>
              </div>

              {/* Item details */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-slate-400" />
                  Return Item Details
                </h4>
                <div className="space-y-1.5 bg-slate-50 border border-slate-100 rounded-lg p-3 text-sm">
                  <div>
                    <span className="text-slate-400 text-xs block">Product SKU & Name</span>
                    <span className="font-semibold text-slate-800 truncate block">
                      {request.itemName} ({request.itemSku})
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <span className="text-slate-400 text-xs block">Quantity</span>
                      <span className="font-semibold text-slate-800">{request.quantity}</span>
                    </div>
                    <div>
                      <span className="text-slate-400 text-xs block">Reason</span>
                      <span className="font-semibold text-slate-800">{REASON_LABELS[request.reason] || request.reason}</span>
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400 text-xs block">Order Number</span>
                    <span className="font-semibold text-slate-800">{request.orderNumber}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Resolution Block */}
            {(request.resolution || request.refundAmount) && (
              <div className="pt-5 border-t border-slate-100 space-y-3">
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-slate-400" />
                  Approval Resolution Details
                </h4>
                <div className="bg-indigo-50/50 border border-indigo-100/50 rounded-lg p-3 text-sm grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-slate-500 text-xs block">Resolution Decision</span>
                    <span className="font-bold text-indigo-950">
                      {RESOLUTION_LABELS[request.resolution] || request.resolution}
                    </span>
                  </div>
                  {request.resolution === 'REFUND' && (
                    <div>
                      <span className="text-slate-500 text-xs block">Refund Amount Approved</span>
                      <span className="font-bold text-indigo-950">${Number(request.refundAmount).toFixed(2)}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <NotesTimeline
            requestId={request.id}
            notes={request.notes || []}
            onAddNote={handleAddNote}
          />
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <RequestActions request={request} onUpdate={handleUpdate} />

          <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
              <Calendar className="w-4 h-4 text-slate-400" />
              History Log
            </h3>
            <div className="space-y-3 text-xs text-slate-500">
              <div>
                <span className="block font-medium text-slate-400">Created Date</span>
                <span className="font-semibold text-slate-700">{formatDate(request.createdAt)}</span>
              </div>
              <div>
                <span className="block font-medium text-slate-400">Last Modified</span>
                <span className="font-semibold text-slate-700">{formatDate(request.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
