'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth, crm } from '@/lib/api';
import { MessageSquare, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await auth.login(email, password);
      localStorage.setItem('auth_token', res.access_token);
      localStorage.setItem('tenant_id', res.tenant_id);

      // Resolve fixed onboarding business slug
      try {
        const settings = await crm.getSettings();
        const slug = settings.slug || 'boldlabs';
        localStorage.setItem('tenant_slug', slug);
        router.push(`/${slug}`);
      } catch {
        const defaultSlug = 'boldlabs';
        localStorage.setItem('tenant_slug', defaultSlug);
        router.push(`/${defaultSlug}`);
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Invalid credentials. Please verify your email and password.');
    } finally {
      setLoading(false);
    }
  }

  function fillDemo() {
    setEmail('admin@demo.com');
    setPassword('admin123456');
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
            WhatsApp CRM Platform
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

          {/* Quick Demo Helper */}
          <div className="pt-3 border-t border-border text-center">
            <button
              type="button"
              onClick={fillDemo}
              className="inline-flex items-center gap-1.5 text-xs text-text-muted hover:text-text-primary transition-colors duration-150 cursor-pointer font-mono"
            >
              <ShieldCheck className="w-3.5 h-3.5 stroke-[1.5]" />
              <span>Fill demo credentials</span>
            </button>
          </div>
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-text-muted mt-6">
          &copy; {new Date().getFullYear()} WhatsApp Automation System
        </p>
      </div>
    </div>
  );
}
