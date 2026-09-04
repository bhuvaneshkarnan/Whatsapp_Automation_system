'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, crm } from '@/lib/api';
import {
  MessageSquare,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
  Loader2,
  CreditCard,
  ExternalLink,
  RefreshCw,
  AlertTriangle,
  ArrowLeft
} from 'lucide-react';

interface PaymentRequiredDetails {
  code: string;
  status: string;
  org_name?: string;
  short_url?: string;
  message?: string;
}

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [paymentRequired, setPaymentRequired] = useState<PaymentRequiredDetails | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.login(email, password, rememberMe);
      localStorage.setItem('auth_token', res.access_token);
      localStorage.setItem('tenant_id', res.tenant_id);

      // Check if logged in user is super_admin
      try {
        const me = await auth.me();
        if (me.role === 'super_admin') {
          router.push('/bhuvanesh');
          return;
        }
      } catch {}

      // Standard client: route directly to their business workspace
      try {
        const settings = await crm.getSettings();
        const slug = settings.slug || 'boldlabs';
        localStorage.setItem('tenant_slug', slug);
        router.push(`/${slug}`);
      } catch {
        localStorage.setItem('tenant_slug', 'boldlabs');
        router.push('/boldlabs');
      }
    } catch (err: any) {
      if (err?.code === 'PAYMENT_REQUIRED' && err.paymentDetails) {
        setPaymentRequired(err.paymentDetails);
      } else {
        const rawMsg = err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.';
        const cleanMsg = rawMsg.replace(/^(Error:\s*|API Error \(\d+\):\s*|Login failed:\s*\d+\s*[-:]?\s*)/i, '').trim();
        setError(cleanMsg || 'Incorrect email or password. Please verify your credentials.');
      }
    } finally {
      setLoading(false);
    }
  }

  if (paymentRequired) {
    const isPaused = paymentRequired.status === 'paused' || paymentRequired.status === 'cancelled';
    return (
      <div className="min-h-screen bg-canvas text-text-primary flex flex-col justify-center items-center px-4 font-sans">
        <div className="w-full max-w-md">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-500 mb-3">
              <CreditCard className="w-6 h-6 stroke-[1.5]" />
            </div>
            <h1 className="text-xl font-bold text-text-primary">
              Subscription Payment Required
            </h1>
            <p className="text-xs text-text-muted mt-1">
              {paymentRequired.org_name ? `Organization: ${paymentRequired.org_name}` : 'Boldlabs CRM'}
            </p>
          </div>

          {/* Card */}
          <div className="bg-surface border border-border rounded-lg p-6 space-y-4 shadow-sm">
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-md flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-semibold text-amber-600 dark:text-amber-400">
                  {isPaused ? 'Workspace Access Paused' : 'Payment Retry Pending'}
                </p>
                <p className="text-text-secondary leading-relaxed">
                  Your monthly subscription (₹3,499/mo) has an outstanding balance.
                  Your customer contacts and settings remain safely preserved.
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-2">
              {paymentRequired.short_url ? (
                <a
                  href={paymentRequired.short_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-medium text-sm rounded-md transition-colors duration-150 flex items-center justify-center gap-2 shadow-sm"
                >
                  <CreditCard className="w-4 h-4" />
                  <span>Pay Now via Razorpay (₹3,499)</span>
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              ) : (
                <p className="text-xs text-center text-text-muted">
                  Please contact platform support to generate a payment link.
                </p>
              )}

              <button
                type="button"
                onClick={() => {
                  setPaymentRequired(null);
                  setError('');
                }}
                className="w-full py-2 px-4 bg-surface-subtle hover:bg-surface border border-border text-text-secondary font-medium text-xs rounded-md transition-colors duration-150 flex items-center justify-center gap-2 cursor-pointer"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Return to Login</span>
              </button>
            </div>
          </div>

          {/* Footer */}
          <p className="text-center text-xs text-text-muted mt-6">
            Need assistance? Contact support at support@boldlabs.ai
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas text-text-primary flex flex-col justify-center items-center px-4 font-sans">
      <div className="w-full max-w-sm">
        {/* Brand */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-10 h-10 rounded-sm bg-accent text-white mb-3">
            <MessageSquare className="w-5 h-5 stroke-[1.5]" />
          </div>
          <h1 className="text-xl font-semibold text-text-primary">
            Boldlabs CRM
          </h1>
          <p className="text-xs text-text-muted mt-1">
            Sign in to access your business inbox and bookings
          </p>
        </div>

        {/* Form Container */}
        <div className="bg-surface border border-border rounded-md p-6 space-y-4">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                Email address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Mail className="w-4 h-4 stroke-[1.5]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-sm text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150"
                  placeholder="admin@business.com"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-[13px] font-medium text-text-secondary mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-text-muted">
                  <Lock className="w-4 h-4 stroke-[1.5]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-white border border-border rounded-sm text-sm text-text-primary placeholder:text-text-muted transition-colors duration-150"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-border text-accent focus:ring-accent accent-accent cursor-pointer"
                />
                <span className="text-xs text-text-secondary">Remember me for 30 days</span>
              </label>
            </div>

            {error && (
              <div className="p-3 bg-status-error-bg border border-status-error-border text-status-error text-xs rounded-sm flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-status-error shrink-0 mt-0.5 stroke-[1.5]" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 px-4 bg-accent hover:bg-accent-hover text-white font-medium text-sm rounded-sm transition-colors duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[1.5]" />
                  <span>Signing in...</span>
                </>
              ) : (
                <>
                  <span>Sign in</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          &copy; {new Date().getFullYear()} Boldlabs CRM. All rights reserved.
        </p>
      </div>
    </div>
  );
}
