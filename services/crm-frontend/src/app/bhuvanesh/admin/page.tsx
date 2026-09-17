'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { auth } from '@/lib/api';
import AdminClientsPage from '../../admin/clients/page';

export default function BhuvaneshAdminPage() {
  const router = useRouter();
  const [authorized, setAuthorized] = useState(false);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('auth_token') : null;
    if (!token) {
      router.replace('/bhuvanesh');
      return;
    }

    auth.me()
      .then((user) => {
        if (user && user.role === 'super_admin') {
          setAuthorized(true);
        } else {
          router.replace('/dashboard');
        }
      })
      .catch(() => {
        router.replace('/bhuvanesh');
      });
  }, []);

  if (!authorized) {
    return (
      <div className="min-h-screen bg-[#0a0f1d] flex flex-col items-center justify-center gap-3 select-none">
        <div className="w-9 h-9 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-xs text-slate-400 font-medium tracking-wide">Verifying Administrator Session...</span>
      </div>
    );
  }

  return <AdminClientsPage />;
}
