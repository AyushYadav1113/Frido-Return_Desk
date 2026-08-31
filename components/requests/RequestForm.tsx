'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CreateRequestSchema } from '@/lib/validation';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface RequestFormProps {
  initialData?: {
    id?: string;
    customerName: string;
    customerEmail: string;
    customerPhone?: string | null;
    orderNumber: string;
    itemName: string;
    itemSku: string;
    quantity: number;
    reason: string;
  };
  isEdit?: boolean;
}

export default function RequestForm({ initialData, isEdit = false }: RequestFormProps) {
  const router = useRouter();

  const [customerName, setCustomerName] = useState(initialData?.customerName || '');
  const [customerEmail, setCustomerEmail] = useState(initialData?.customerEmail || '');
  const [customerPhone, setCustomerPhone] = useState(initialData?.customerPhone || '');
  const [orderNumber, setOrderNumber] = useState(initialData?.orderNumber || '');
  const [itemName, setItemName] = useState(initialData?.itemName || '');
  const [itemSku, setItemSku] = useState(initialData?.itemSku || '');
  const [quantity, setQuantity] = useState<number | string>(initialData?.quantity || 1);
  const [reason, setReason] = useState(initialData?.reason || 'DAMAGED');

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setGeneralError(null);
    setSuccessMsg(null);

    const payload = {
      customerName,
      customerEmail,
      customerPhone: customerPhone || null,
      orderNumber,
      itemName,
      itemSku,
      quantity: Number(quantity),
      reason,
    };

    // Client-side Zod validation
    const validation = CreateRequestSchema.safeParse(payload);
    if (!validation.success) {
      const fieldErrors: Record<string, string> = {};
      validation.error.errors.forEach((err) => {
        const path = err.path[0] as string;
        fieldErrors[path] = err.message;
      });
      setErrors(fieldErrors);
      setLoading(false);
      return;
    }

    try {
      const url = isEdit ? `/api/requests/${initialData?.id}` : '/api/requests';
      const method = isEdit ? 'PATCH' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await res.json();

      if (!res.ok) {
        if (data?.error) {
          if (data.error.code === 'DUPLICATE_LIVE_REQUEST') {
            setErrors({
              orderNumber: 'A live return request already exists for this order and item.',
              itemSku: 'A live return request already exists for this order and item.',
            });
            setGeneralError(data.error.message);
          } else {
            setGeneralError(`${data.error.code}: ${data.error.message}`);
          }
        } else {
          setGeneralError('An unexpected server error occurred.');
        }
        setLoading(false);
        return;
      }

      setSuccessMsg(isEdit ? 'Request updated successfully.' : 'Request created successfully.');

      setTimeout(() => {
        router.push(`/requests/${data.id || initialData?.id}`);
        router.refresh();
      }, 1500);

    } catch (err) {
      setGeneralError('Network error. Unable to connect to server.');
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-2xl bg-white border border-slate-200 rounded-xl p-6 md:p-8 shadow-sm">
      <h2 className="text-xl font-bold text-slate-800 border-b border-slate-100 pb-3">
        {isEdit ? 'Edit Return Request' : 'New Return Request'}
      </h2>

      {generalError && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-lg p-4 text-sm flex items-start gap-2.5" role="alert">
          <AlertCircle className="w-5 h-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <span className="font-bold">Error:</span> {generalError}
          </div>
        </div>
      )}

      {successMsg && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-lg p-4 text-sm flex items-start gap-2.5" role="alert">
          <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
          <div className="font-semibold">{successMsg}</div>
        </div>
      )}

      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Customer Details</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="customerName" className="block text-sm font-medium text-slate-700 mb-1">Customer Name *</label>
            <input
              id="customerName"
              type="text"
              className={`block w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 ${
                errors.customerName ? 'border-rose-300 ring-rose-100 ring-2' : 'border-slate-300'
              }`}
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. John Doe"
            />
            {errors.customerName && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.customerName}</p>}
          </div>

          <div>
            <label htmlFor="customerEmail" className="block text-sm font-medium text-slate-700 mb-1">Customer Email *</label>
            <input
              id="customerEmail"
              type="email"
              className={`block w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 ${
                errors.customerEmail ? 'border-rose-300 ring-rose-100 ring-2' : 'border-slate-300'
              }`}
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="e.g. john@example.com"
            />
            {errors.customerEmail && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.customerEmail}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="customerPhone" className="block text-sm font-medium text-slate-700 mb-1">Customer Phone</label>
            <input
              id="customerPhone"
              type="text"
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              value={customerPhone || ''}
              onChange={(e) => setCustomerPhone(e.target.value)}
              placeholder="e.g. 9876543210"
            />
          </div>
        </div>
      </div>

      <div className="space-y-4 pt-4 border-t border-slate-100">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Order & Item Details</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label htmlFor="orderNumber" className="block text-sm font-medium text-slate-700 mb-1">Order Number *</label>
            <input
              id="orderNumber"
              type="text"
              className={`block w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 ${
                errors.orderNumber ? 'border-rose-300 ring-rose-100 ring-2' : 'border-slate-300'
              }`}
              value={orderNumber}
              onChange={(e) => setOrderNumber(e.target.value)}
              placeholder="e.g. ORD-1001"
            />
            {errors.orderNumber && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.orderNumber}</p>}
          </div>

          <div>
            <label htmlFor="itemSku" className="block text-sm font-medium text-slate-700 mb-1">Item SKU *</label>
            <input
              id="itemSku"
              type="text"
              className={`block w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 ${
                errors.itemSku ? 'border-rose-300 ring-rose-100 ring-2' : 'border-slate-300'
              }`}
              value={itemSku}
              onChange={(e) => setItemSku(e.target.value)}
              placeholder="e.g. NIKE-001"
            />
            {errors.itemSku && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.itemSku}</p>}
          </div>

          <div className="md:col-span-2">
            <label htmlFor="itemName" className="block text-sm font-medium text-slate-700 mb-1">Item Name *</label>
            <input
              id="itemName"
              type="text"
              className={`block w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 ${
                errors.itemName ? 'border-rose-300 ring-rose-100 ring-2' : 'border-slate-300'
              }`}
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              placeholder="e.g. Nike Air Max Shoes"
            />
            {errors.itemName && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.itemName}</p>}
          </div>

          <div>
            <label htmlFor="quantity" className="block text-sm font-medium text-slate-700 mb-1">Quantity *</label>
            <input
              id="quantity"
              type="number"
              min="1"
              step="1"
              className={`block w-full px-3 py-2 border rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800 ${
                errors.quantity ? 'border-rose-300 ring-rose-100 ring-2' : 'border-slate-300'
              }`}
              value={quantity}
              onChange={(e) => setQuantity(e.target.value === '' ? '' : Number(e.target.value))}
            />
            {errors.quantity && <p className="text-xs text-rose-600 mt-1 font-semibold">{errors.quantity}</p>}
          </div>

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-1">Reason for Return *</label>
            <select
              id="reason"
              className="block w-full px-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-800"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
            >
              <option value="DAMAGED">Damaged</option>
              <option value="WRONG_ITEM">Wrong Item</option>
              <option value="SIZE_ISSUE">Size Issue</option>
              <option value="NOT_AS_DESCRIBED">Not As Described</option>
              <option value="CHANGED_MIND">Changed Mind</option>
            </select>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4 pt-4 border-t border-slate-100 justify-end">
        <button
          type="button"
          className="px-4 py-2 border border-slate-300 rounded-lg text-sm font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          onClick={() => {
            if (isEdit) {
              router.push(`/requests/${initialData?.id}`);
            } else {
              router.push('/requests');
            }
          }}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-400 text-white px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-sm flex items-center gap-1.5 active:scale-[0.98]"
          disabled={loading}
        >
          {loading ? 'Saving...' : isEdit ? 'Save Changes' : 'Submit Return Request'}
        </button>
      </div>
    </form>
  );
}
