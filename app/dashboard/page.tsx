'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';

export default function DashboardPage() {
  const router = useRouter();

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check account type and redirect accordingly
      const accountType = user.user_metadata?.account_type;
      if (accountType === 'professor') {
        router.push('/dashboard/professor');
        return;
      }

      // Redirect students to student dashboard
      router.push('/dashboard/student');
    };

    getUser();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">Redirecting...</div>
    </div>
  );
}

