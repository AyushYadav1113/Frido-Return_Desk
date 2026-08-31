'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Search } from 'lucide-react';

export default function RequestFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchTerm, setSearchTerm] = useState(searchParams.get('search') || '');
  const searchRef = useRef<string>(searchTerm);

  const currentStatus = searchParams.get('status') || 'All';
  const currentReason = searchParams.get('reason') || 'All';
  const currentSortBy = searchParams.get('sortBy') || 'createdAt';
  const currentSortOrder = searchParams.get('sortOrder') || 'desc';

  const updateUrl = React.useCallback((updates: Record<string, string | null>) => {
    const params = new URLSearchParams(searchParams.toString());
    
    Object.entries(updates).forEach(([key, val]) => {
      if (val === null || val === 'All' || val === '') {
        params.delete(key);
      } else {
        params.set(key, val);
      }
    });

    router.push(`/requests?${params.toString()}`);
  }, [router, searchParams]);

  useEffect(() => {
    setSearchTerm(searchParams.get('search') || '');
  }, [searchParams]);

  useEffect(() => {
    searchRef.current = searchTerm;
    const delayDebounce = setTimeout(() => {
      const currentParam = searchParams.get('search') || '';
      if (searchRef.current !== currentParam) {
        updateUrl({ search: searchRef.current, page: '1' });
      }
    }, 400);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm, searchParams, updateUrl]);

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 shadow-sm space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Search Input */}
        <div className="relative md:col-span-2">
          <label htmlFor="search" className="sr-only">Search</label>
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            id="search"
            type="text"
            className="block w-full pl-9 pr-3 py-2 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder-slate-400 text-slate-800"
            placeholder="Search by customer, order, reference..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Status Select */}
        <div>
          <label htmlFor="status" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Status</label>
          <select
            id="status"
            className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
            value={currentStatus}
            onChange={(e) => updateUrl({ status: e.target.value, page: '1' })}
          >
            <option value="All">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_REVIEW">In Review</option>
            <option value="APPROVED">Approved</option>
            <option value="REJECTED">Rejected</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </div>

        {/* Reason Select */}
        <div>
          <label htmlFor="reason" className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Reason</label>
          <select
            id="reason"
            className="block w-full py-2 px-3 border border-slate-300 rounded-lg text-sm bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700"
            value={currentReason}
            onChange={(e) => updateUrl({ reason: e.target.value, page: '1' })}
          >
            <option value="All">All Reasons</option>
            <option value="DAMAGED">Damaged</option>
            <option value="WRONG_ITEM">Wrong Item</option>
            <option value="SIZE_ISSUE">Size Issue</option>
            <option value="NOT_AS_DESCRIBED">Not As Described</option>
            <option value="CHANGED_MIND">Changed Mind</option>
          </select>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 pt-3 border-t border-slate-100">
        {/* Sort Select */}
        <div className="flex items-center gap-2">
          <label htmlFor="sortBy" className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sort By</label>
          <select
            id="sortBy"
            className="py-1 px-2.5 border border-slate-300 rounded-md text-xs bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all text-slate-700 font-medium"
            value={`${currentSortBy}-${currentSortOrder}`}
            onChange={(e) => {
              const [field, order] = e.target.value.split('-');
              updateUrl({ sortBy: field, sortOrder: order });
            }}
          >
            <option value="createdAt-desc">Newest First</option>
            <option value="createdAt-asc">Oldest First</option>
            <option value="customerName-asc">Customer Name (A-Z)</option>
            <option value="customerName-desc">Customer Name (Z-A)</option>
            <option value="orderNumber-asc">Order Number (A-Z)</option>
            <option value="reference-asc">Reference (A-Z)</option>
          </select>
        </div>

        {/* Clear Trigger */}
        {(searchTerm || currentStatus !== 'All' || currentReason !== 'All') && (
          <button
            type="button"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            onClick={() => {
              setSearchTerm('');
              router.push('/requests');
            }}
          >
            Clear Active Filters
          </button>
        )}
      </div>
    </div>
  );
}
