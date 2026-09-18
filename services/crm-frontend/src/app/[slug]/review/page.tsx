import { Suspense } from 'react';
import ReviewClient from './ReviewClient';

export function generateStaticParams() {
  return [
    { slug: 'boldlabs' },
    { slug: 'mindbodyrecovery' },
    { slug: 'bizpipe-demo' },
    { slug: 'smaato-mobile' },
    { slug: 'dashboard' },
  ];
}

export default function PublicReviewPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-canvas text-text-primary flex items-center justify-center p-4">
        <div className="animate-pulse text-xs font-medium text-text-muted">Loading Review Portal...</div>
      </div>
    }>
      <ReviewClient />
    </Suspense>
  );
}

