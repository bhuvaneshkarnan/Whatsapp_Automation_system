import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex items-center justify-center p-6 text-center">
      <div className="max-w-md w-full bg-surface border border-border rounded-lg p-6 shadow-sm space-y-4">
        <h2 className="text-2xl font-bold text-text-primary">404 - Page Not Found</h2>
        <p className="text-xs text-text-muted">The page you requested does not exist or has been moved.</p>
        <Link
          href="/dashboard"
          className="inline-block py-2 px-4 bg-accent hover:bg-accent-hover text-white rounded text-xs font-semibold"
        >
          Return to Dashboard
        </Link>
      </div>
    </div>
  );
}
