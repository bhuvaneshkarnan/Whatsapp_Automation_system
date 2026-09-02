'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    const slug = localStorage.getItem('tenant_slug') || 'boldlabs';
    if (token) {
      router.replace(`/${slug}`);
    } else {
      router.replace('/login');
    }
  }, [router]);

  return null;
}
