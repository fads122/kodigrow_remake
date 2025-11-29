'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';

export default function ProfessorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is a professor
      const accountType = user.user_metadata?.account_type;
      if (accountType !== 'professor') {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      setLoading(false);
    };

    getUser();
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div>Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, Professor!</h1>
        <p className="text-muted-foreground mt-2">
          {user?.email}
        </p>
      </div>
      
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Active Courses</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground mt-1">No courses yet</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Total Students</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground mt-1">No students enrolled</p>
        </div>
        
        <div className="rounded-lg border bg-card p-6">
          <h3 className="font-semibold mb-2">Pending Assignments</h3>
          <p className="text-2xl font-bold">0</p>
          <p className="text-sm text-muted-foreground mt-1">All caught up!</p>
        </div>
      </div>
    </div>
  );
}

