import React from 'react';
import Link from 'next/link';
import RequestStatusBadge from './RequestStatusBadge';
import { Eye, Edit2 } from 'lucide-react';

interface Request {
  id: string;
  reference: string;
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  itemName: string;
  itemSku: string;
  quantity: number;
  reason: string;
  status: string;
  createdAt: Date | string;
}

interface RequestTableProps {
  requests: Request[];
}

const REASON_LABELS: Record<string, string> = {
  DAMAGED: 'Damaged',
  WRONG_ITEM: 'Wrong Item',
  SIZE_ISSUE: 'Size Issue',
  NOT_AS_DESCRIBED: 'Not As Described',
  CHANGED_MIND: 'Changed Mind',
};

export default function RequestTable({ requests }: RequestTableProps) {
  const formatDate = (dateStr: Date | string) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const isEditable = (status: string) => {
    return ['OPEN', 'IN_REVIEW'].includes(status);
  };

  return (
    <div>
      {/* Mobile Layout (Cards) */}
      <div className="md:hidden space-y-4">
        {requests.map((request) => (
          <div
            key={request.id}
            className="bg-white border border-slate-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all flex flex-col gap-3"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded px-2 py-0.5">
                {request.reference}
              </span>
              <RequestStatusBadge status={request.status} />
            </div>

            <div className="space-y-0.5">
              <h3 className="font-semibold text-slate-800 text-sm">{request.customerName}</h3>
              <p className="text-xs text-slate-500">{request.customerEmail}</p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs border-t border-slate-100 pt-3">
              <div>
                <span className="text-slate-400 block font-medium">Order Number</span>
                <span className="text-slate-700 font-semibold">{request.orderNumber}</span>
              </div>
              <div>
                <span className="text-slate-400 block font-medium">Reason</span>
                <span className="text-slate-700 font-semibold">{REASON_LABELS[request.reason] || request.reason}</span>
              </div>
              <div className="col-span-2">
                <span className="text-slate-400 block font-medium">Item & Qty</span>
                <span className="text-slate-700 font-semibold truncate block">
                  {request.itemName} ({request.itemSku}) &times; {request.quantity}
                </span>
              </div>
            </div>

            <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-xs text-slate-400">
              <span>{formatDate(request.createdAt)}</span>
              <div className="flex items-center gap-2">
                <Link
                  href={`/requests/${request.id}`}
                  className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View
                </Link>
                {isEditable(request.status) && (
                  <Link
                    href={`/requests/${request.id}/edit`}
                    className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-md font-semibold transition-all flex items-center gap-1"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                    Edit
                  </Link>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Desktop Layout (Table) */}
      <div className="hidden md:block overflow-hidden bg-white border border-slate-200 rounded-xl shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left text-sm text-slate-700">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 font-semibold uppercase text-xs tracking-wider">
                <th className="py-4 px-6">Reference</th>
                <th className="py-4 px-6">Customer</th>
                <th className="py-4 px-6">Order</th>
                <th className="py-4 px-6">Item Details</th>
                <th className="py-4 px-6">Reason</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6">Created Date</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200 font-medium">
              {requests.map((request) => (
                <tr key={request.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="py-4 px-6 font-mono text-xs font-semibold text-slate-500">
                    <span className="bg-slate-50 border border-slate-100 rounded px-2 py-1">
                      {request.reference}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="font-semibold text-slate-800">{request.customerName}</div>
                    <div className="text-xs text-slate-500">{request.customerEmail}</div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{request.orderNumber}</td>
                  <td className="py-4 px-6">
                    <div className="text-slate-800 font-semibold truncate max-w-[180px]" title={request.itemName}>
                      {request.itemName}
                    </div>
                    <div className="text-xs text-slate-400">
                      SKU: {request.itemSku} &bull; Qty: {request.quantity}
                    </div>
                  </td>
                  <td className="py-4 px-6 font-semibold text-slate-800">{REASON_LABELS[request.reason] || request.reason}</td>
                  <td className="py-4 px-6">
                    <RequestStatusBadge status={request.status} />
                  </td>
                  <td className="py-4 px-6 text-slate-500 font-normal">{formatDate(request.createdAt)}</td>
                  <td className="py-4 px-6 text-right">
                    <div className="inline-flex items-center gap-2">
                      <Link
                        href={`/requests/${request.id}`}
                        className="bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 hover:shadow-sm"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View
                      </Link>
                      {isEditable(request.status) ? (
                        <Link
                          href={`/requests/${request.id}/edit`}
                          className="bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all inline-flex items-center gap-1.5 hover:shadow-sm"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                          Edit
                        </Link>
                      ) : (
                        <span className="w-[68px]" />
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
