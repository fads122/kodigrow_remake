'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../lib/supabase';
import FloatingLines from '../components/ui/FloatingLines';

export default function DashboardPage() {
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

      // Check account type and redirect accordingly
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

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-950 text-white">
        <div>Loading...</div>
      </div>
    );
  }

  const accountType = user?.user_metadata?.account_type || 'student';

  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* FloatingLines background */}
      <div className="absolute inset-0 -z-10 w-full h-full">
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={5}
          lineDistance={5}
          bendRadius={5}
          bendStrength={-0.5}
          interactive={true}
          parallax={true}
        />
      </div>

      <div className="relative w-full max-w-2xl mx-auto px-4 py-8">
        <div className="bg-slate-900/80 backdrop-blur-xl rounded-3xl border border-slate-800/50 shadow-2xl p-10 text-white">
          <h1 className="text-3xl font-bold mb-4">Welcome to KodiGrow!</h1>
          <p className="text-slate-300 mb-6">
            You're logged in as a <span className="font-semibold text-blue-400 capitalize">{accountType}</span>
          </p>
          <p className="text-slate-400 mb-8">
            Email: {user?.email}
          </p>
          <button
            onClick={handleSignOut}
            className="px-6 py-3 bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}

