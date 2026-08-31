import React from 'react';
import Link from 'next/link';
import RequestForm from '@/components/requests/RequestForm';
import { ArrowLeft } from 'lucide-react';

export default function NewRequestPage() {
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <Link
          href="/requests"
          className="text-sm font-semibold text-slate-500 hover:text-slate-800 transition-colors inline-flex items-center gap-1.5 mb-4 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
          Back to Dashboard
        </Link>
        <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Create Return Request</h1>
        <p className="text-slate-500 text-sm">Submit details to initiate a new customer product return request</p>
      </div>

      <RequestForm />
    </div>
  );
}
