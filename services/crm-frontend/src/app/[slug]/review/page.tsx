import { Suspense } from 'react';
import ReviewClient from './ReviewClient';

export function generateStaticParams() {
  return [
    { slug: 'boldlabs' },
    { slug: 'mindbodyrecovery' },
    { slug: 'dashboard' },
  ];
}

export default function PublicReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center p-4">
        <div className="animate-pulse text-sm font-medium text-slate-400">Loading Review Collector...</div>
      </div>
    }>
      <ReviewClient />
    </Suspense>
  );
}

