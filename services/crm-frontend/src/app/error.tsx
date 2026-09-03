'use client';

import { useEffect } from 'react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Next.js Client Exception:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6">
      <div className="max-w-lg w-full bg-surface border border-rose-200 rounded-lg p-6 shadow-md space-y-4">
        <div className="flex items-center gap-2 text-rose-600">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <h2 className="text-base font-semibold">Application Client Error</h2>
        </div>
        <p className="text-xs text-text-muted">
          A client-side error occurred while rendering the dashboard. Details below:
        </p>
        <div className="bg-rose-50 border border-rose-200 rounded p-3 text-xs font-mono text-rose-800 break-words whitespace-pre-wrap max-h-60 overflow-y-auto">
          {error.message || 'Unknown exception'}
          {error.stack && (
            <div className="mt-2 pt-2 border-t border-rose-200 text-[11px] text-rose-600">
              {error.stack}
            </div>
          )}
        </div>
        <div className="flex gap-2 pt-2">
          <button
            onClick={() => reset()}
            className="flex-1 py-2 px-4 bg-accent hover:bg-accent-hover text-white rounded text-xs font-semibold cursor-pointer transition-colors"
          >
            Try again
          </button>
          <button
            onClick={() => {
              if (typeof window !== 'undefined') {
                window.location.reload();
              }
            }}
            className="flex-1 py-2 px-4 border border-border text-text-secondary hover:text-text-primary rounded text-xs font-medium cursor-pointer transition-colors"
          >
            Reload page
          </button>
        </div>
      </div>
    </div>
  );
}
