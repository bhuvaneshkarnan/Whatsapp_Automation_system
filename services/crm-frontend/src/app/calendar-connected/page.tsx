'use client';

import { Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, XCircle, Calendar, ArrowRight } from 'lucide-react';
import Link from 'next/link';

function CalendarConnectedContent() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success') === 'true';
  const error = searchParams.get('error');

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center p-4 font-sans antialiased text-slate-900 dark:text-zinc-100">
      <div className="max-w-md w-full bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl p-8 shadow-xl text-center space-y-6">
        
        {/* Header Icon */}
        <div className="flex justify-center">
          {success ? (
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-9 h-9 stroke-[2]" />
            </div>
          ) : (
            <div className="w-16 h-16 rounded-full bg-rose-100 dark:bg-rose-950/60 border border-rose-300 dark:border-rose-800 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <XCircle className="w-9 h-9 stroke-[2]" />
            </div>
          )}
        </div>

        {/* Text Details */}
        <div className="space-y-2">
          <h1 className="text-2xl font-bold tracking-tight">
            {success ? 'Google Calendar Connected!' : 'Connection Incomplete'}
          </h1>
          <p className="text-sm text-slate-600 dark:text-zinc-400 leading-relaxed">
            {success
              ? 'Your Google Calendar and Tasks have been successfully synchronized with the CRM. Your bookings, appointments, and follow-ups will now sync in real time.'
              : error
              ? `There was an issue linking your calendar (${error}). Please ask your administrator to send a new authorization link.`
              : 'The authorization flow was cancelled or expired.'}
          </p>
        </div>

        {/* Feature Highlights */}
        {success && (
          <div className="bg-slate-50 dark:bg-zinc-800/50 border border-slate-200 dark:border-zinc-800 rounded-xl p-4 text-left space-y-2.5 text-xs text-slate-600 dark:text-zinc-300">
            <div className="flex items-center gap-2 font-semibold text-slate-800 dark:text-zinc-100">
              <Calendar className="w-4 h-4 text-blue-500" />
              <span>What happens next?</span>
            </div>
            <ul className="space-y-1.5 list-disc list-inside text-slate-500 dark:text-zinc-400">
              <li>Appointments booked via WhatsApp sync to your Google Calendar.</li>
              <li>Schedule changes and cancellations update automatically.</li>
              <li>You can safely close this browser window.</li>
            </ul>
          </div>
        )}

        {/* Actions */}
        <div className="pt-2 flex flex-col gap-2.5">
          {success ? (
            <button
              onClick={() => window.close()}
              className="w-full py-2.5 px-4 bg-slate-900 hover:bg-slate-800 dark:bg-zinc-100 dark:hover:bg-white text-white dark:text-zinc-900 font-semibold rounded-lg text-sm transition-colors shadow-sm"
            >
              Close this window
            </button>
          ) : (
            <Link
              href="/login"
              className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-sm transition-colors flex items-center justify-center gap-2"
            >
              <span>Go to Login</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          )}
        </div>

        <p className="text-[11px] text-slate-400 dark:text-zinc-500">
          Powered by Boldlabs CRM & WhatsApp Automation Platform
        </p>
      </div>
    </div>
  );
}

export default function CalendarConnectedPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-50 dark:bg-zinc-950 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900 dark:border-white"></div>
      </div>
    }>
      <CalendarConnectedContent />
    </Suspense>
  );
}
