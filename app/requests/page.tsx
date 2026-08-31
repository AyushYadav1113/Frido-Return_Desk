'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import RequestFilters from '@/components/requests/RequestFilters';
import RequestTable from '@/components/requests/RequestTable';
import { Loader2, Plus, AlertTriangle, RefreshCw } from 'lucide-react';
import Link from 'next/link';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();

  // State
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<boolean>(false);
  const [pagination, setPagination] = useState({
    page: 1,
    pageSize: 10,
    total: 0,
    totalPages: 0,
  });

  const fetchRequests = React.useCallback(async () => {
    setLoading(true);
    setError(false);

    try {
      const query = new URLSearchParams(searchParams.toString()).toString();
      const res = await fetch(`/api/requests?${query}`);
      
      if (!res.ok) {
        throw new Error('Failed to fetch requests');
      }

      const result = await res.json();
      setRequests(result.data || []);
      setPagination(result.pagination || { page: 1, pageSize: 10, total: 0, totalPages: 0 });
    } catch (err) {
      console.error(err);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, [searchParams]);

  useEffect(() => {
    fetchRequests();
  }, [searchParams, fetchRequests]);

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    const params = new URLSearchParams(searchParams.toString());
    params.set('page', newPage.toString());
    router.push(`/requests?${params.toString()}`);
  };

  const currentPage = pagination.page;
  const totalPages = pagination.totalPages;
  const total = pagination.total;
  const pageSize = pagination.pageSize;

  return (
    <div className="space-y-6">
      {/* Upper header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">Return Requests</h1>
          <p className="text-slate-500 text-sm">Manage and review product return requests</p>
        </div>
        <Link
          href="/requests/new"
          className="bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 text-white px-4 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm hover:shadow active:scale-[0.98] flex items-center justify-center gap-1.5 self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          Create Return Request
        </Link>
      </div>

      {/* Filter panel */}
      <RequestFilters />

      {/* Table & states */}
      {loading ? (
        <div className="space-y-4">
          <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
              <p className="text-slate-500 text-sm font-medium">Loading requests...</p>
            </div>
          </div>
        </div>
      ) : error ? (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-xl p-8 text-center flex flex-col items-center gap-4 shadow-sm">
          <AlertTriangle className="w-12 h-12 text-rose-500" />
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-800">Unable to load requests</h3>
            <p className="text-slate-500 text-sm">Please check your network and try again.</p>
          </div>
          <button
            onClick={fetchRequests}
            className="bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 px-4 py-2 rounded-lg text-sm font-semibold transition-all inline-flex items-center gap-1.5 active:scale-[0.98] shadow-sm"
          >
            <RefreshCw className="w-4 h-4" />
            Retry
          </button>
        </div>
      ) : requests.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-12 text-center flex flex-col items-center gap-4 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center text-slate-400">
            &times;
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-lg text-slate-800">No requests found</h3>
            <p className="text-slate-500 text-sm">Try changing your search or filters.</p>
          </div>
        </div>
      ) : (
        <>
          <RequestTable requests={requests} />

          {/* Pagination controls */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between border border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-xl shadow-sm mt-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage <= 1 || loading}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage >= totalPages || loading}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm text-slate-700 font-medium">
                    Showing <span className="font-semibold text-slate-900">{Math.min((currentPage - 1) * pageSize + 1, total)}</span> to{' '}
                    <span className="font-semibold text-slate-900">{Math.min(currentPage * pageSize, total)}</span> of{' '}
                    <span className="font-semibold text-slate-900">{total}</span> requests
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage <= 1 || loading}
                      className="relative inline-flex items-center rounded-l-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Previous</span>
                      &larr;
                    </button>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                      <button
                        key={p}
                        onClick={() => handlePageChange(p)}
                        aria-current={p === currentPage ? 'page' : undefined}
                        className={`relative inline-flex items-center px-4 py-2 text-sm font-semibold focus:z-20 ${
                          p === currentPage
                            ? 'z-10 bg-indigo-600 text-white focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
                            : 'text-slate-700 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:outline-offset-0'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                    
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={currentPage >= totalPages || loading}
                      className="relative inline-flex items-center rounded-r-md px-2 py-2 text-slate-400 ring-1 ring-inset ring-slate-300 hover:bg-slate-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50"
                    >
                      <span className="sr-only">Next</span>
                      &rarr;
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function RequestsPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20 bg-white border border-slate-200 rounded-xl shadow-sm">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
