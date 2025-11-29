'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { FileText, Calendar, Clock } from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    account_type?: string;
  };
}

export default function StudentAssignmentsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      const accountType = user.user_metadata?.account_type;
      if (accountType === 'professor') {
        router.push('/dashboard/professor');
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
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Assignments</h1>
        <p className="text-muted-foreground mt-1">View and submit your assignments</p>
      </div>

      <div className="rounded-xl border border-border/50 bg-card/50 p-12 backdrop-blur-sm text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
        <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
        <p className="text-muted-foreground">
          Assignments will appear here when your professors create them
        </p>
      </div>
    </div>
  );
}

