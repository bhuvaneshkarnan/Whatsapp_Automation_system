'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import AdminClientsPage from '../admin/clients/page';
import { ShieldCheck, Lock, Mail, ArrowRight, AlertCircle, Loader2 } from 'lucide-react';

export default function BhuvaneshAdminPortalPage() {
  const router = useRouter();
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [adminUser, setAdminUser] = useState<any>(null);

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      setCheckingAuth(false);
      return;
    }

    fetch('/api/v1/auth/users/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error('Unauthorized');
        const user = await res.json();
        if (user.role === 'super_admin') {
          setAdminUser(user);
        } else {
          setAdminUser(null);
        }
      })
      .catch(() => {
        setAdminUser(null);
      })
      .finally(() => {
        setCheckingAuth(false);
      });
  }, []);

  async function handleAdminLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);

    try {
      const res = await auth.login(email, password, rememberMe);
      localStorage.setItem('auth_token', res.access_token);
      localStorage.setItem('tenant_id', res.tenant_id);

      // Verify super admin role
      const me = await auth.me();
      if (me.role !== 'super_admin') {
        localStorage.removeItem('auth_token');
        localStorage.removeItem('tenant_id');
        throw new Error('Access Denied: This login is strictly restricted to platform administrators.');
      }

      setAdminUser(me);
    } catch (err: any) {
      const rawMsg = err instanceof Error ? err.message : 'Invalid administrator credentials.';
      const cleanMsg = rawMsg.replace(/^(Error:\s*|API Error \(\d+\):\s*|Login failed:\s*\d+\s*[-:]?\s*)/i, '').trim();
      setLoginError(cleanMsg || 'Incorrect administrator credentials.');
    } finally {
      setLoginLoading(false);
    }
  }

  // 1. Session verification loader
  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium tracking-wide">Verifying Administrator Session...</span>
      </div>
    );
  }

  // 2. If authenticated as Super Admin, render the master admin console directly
  if (adminUser && adminUser.role === 'super_admin') {
    return <AdminClientsPage />;
  }

  // 3. Otherwise, render the dedicated Admin Login Portal
  return (
    <div className="min-h-screen bg-[#080d19] text-white flex flex-col justify-center items-center px-4 font-sans selection:bg-emerald-500 selection:text-white">
      <div className="w-full max-w-sm">
        {/* Brand Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 mb-3 shadow-[0_0_20px_rgba(16,185,129,0.2)]">
            <ShieldCheck className="w-6 h-6 stroke-[1.5]" />
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">
            Boldlabs Super Admin
          </h1>
          <div className="mt-1.5 flex items-center justify-center gap-1.5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">
              Platform Master Console
            </p>
          </div>
        </div>

        {/* Login Card */}
        <div className="bg-[#0f172a] border border-slate-800 rounded-xl p-6 space-y-4 shadow-2xl backdrop-blur-xl">
          <div className="pb-2 border-b border-slate-800/80">
            <p className="text-xs text-slate-400 leading-relaxed">
              Restricted portal for client organization provisioning, Razorpay subscription management, and system configuration.
            </p>
          </div>

          <form onSubmit={handleAdminLogin} className="space-y-4">
            <div>
              <label className="block text-[12px] font-medium text-slate-300 mb-1.5">
                Admin Email
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Mail className="w-4 h-4 stroke-[1.5]" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="admin@boldlabs.ai"
                  required
                  autoFocus
                />
              </div>
            </div>

            <div>
              <label className="block text-[12px] font-medium text-slate-300 mb-1.5">
                Master Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-500">
                  <Lock className="w-4 h-4 stroke-[1.5]" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-9 pr-3 py-2 bg-slate-900 border border-slate-700/80 rounded-lg text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500 transition-all"
                  placeholder="••••••••••••"
                  required
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-0.5">
              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 text-emerald-500 focus:ring-emerald-500 accent-emerald-500 cursor-pointer"
                />
                <span className="text-xs text-slate-400">Stay signed in (30 days)</span>
              </label>
            </div>

            {loginError && (
              <div className="p-3 bg-red-950/40 border border-red-800/60 text-red-300 text-xs rounded-lg flex items-start gap-2 animate-in fade-in duration-150">
                <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5 stroke-[1.5]" />
                <span className="leading-relaxed">{loginError}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={loginLoading}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white font-semibold text-xs tracking-wide uppercase rounded-lg transition-all duration-150 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer shadow-lg shadow-emerald-950/50"
            >
              {loginLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin stroke-[1.5]" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4 stroke-[1.5]" />
                </>
              )}
            </button>
          </form>
        </div>

        {/* Footer */}
        <p className="text-center text-[11px] text-slate-500 mt-6 tracking-wide">
          &copy; {new Date().getFullYear()} Boldlabs CRM &bull; Secure Platform Operations
        </p>
      </div>
    </div>
  );
}
