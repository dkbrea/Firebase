"use client";

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

export default function HomePage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading) {
      if (isAuthenticated) {
        router.replace('/dashboard');
      } else {
        router.replace('/auth');
      }
    }
  }, [isAuthenticated, loading, router]);

  return (
    <div className="flex h-screen w-screen items-center justify-center">
      <p>Loading Pocket Ledger...</p>
    </div>
  );
}
