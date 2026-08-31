'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import RequestForm from '@/components/requests/RequestForm';
import { ArrowLeft, Loader2, AlertCircle } from 'lucide-react';

interface RequestEditProps {
  params: {
    id: string;
  };
}

export default function RequestEditPage({ params }: RequestEditProps) {
  const router = useRouter();
  const requestId = params.id;

  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequestDetails = async () => {
      try {
        const res = await fetch(`/api/requests/${requestId}`);
        const data = await res.json();

        if (!res.ok) {
          setErrorMsg(data?.error?.message || 'Failed to load return request.');
          setLoading(false);
          return;
        }

        setRequest(data);
      } catch (err) {
        setErrorMsg('Network error. Unable to load details.');
      } finally {
        setLoading(false);
      }
    };

    fetchRequestDetails();
  }, [requestId]);

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

  const isDecided = ['APPROVED', 'REJECTED', 'COMPLETED'].includes(request.status);

  if (isDecided) {
    return (
      <div className="max-w-xl mx-auto py-12 space-y-6">
        <Link
          href={`/requests/${request.id}`}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 mb-2 group"
        >
          <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Request details
        </Link>

        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-6 space-y-4 shadow-sm">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-6 h-6 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <h3 className="font-bold text-base text-slate-800">REQUEST_LOCKED</h3>
              <p className="text-slate-600 text-sm">
                Customer and item details cannot be changed after the request is decided.
              </p>
              <p className="text-slate-500 text-xs mt-1">
                Current status: <span className="font-bold uppercase">{request.status}</span>
              </p>
            </div>
          </div>
          <div className="flex justify-end pt-3 border-t border-rose-100">
            <Link
              href={`/requests/${request.id}`}
              className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all inline-flex items-center shadow-sm"
            >
              View Request Details
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href={`/requests/${request.id}`}
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Request Details
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Edit Return Details</h1>
        <p className="text-slate-500 text-sm">Modify metadata fields for return request {request.reference}</p>
      </div>

      <RequestForm initialData={request} isEdit={true} />
    </div>
  );
}
