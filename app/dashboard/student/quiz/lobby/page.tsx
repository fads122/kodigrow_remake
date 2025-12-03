'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { ArrowLeft, Users, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Avatar } from '@/components/ui/avatar';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    full_name?: string;
  };
}

interface Participant {
  id: string;
  student_id: string;
  joined_at: string;
  status: string;
  profile?: {
    full_name?: string;
    email?: string;
  };
}

interface Session {
  id: string;
  quiz_code: string;
  title: string;
  subject: string | null;
  status: string;
  course?: {
    name: string;
  };
}

function QuizLobbyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get('session') || '';
  const quizCode = searchParams.get('code') || '';

  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
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
      await fetchSession();
      await fetchParticipants();
      setLoading(false);
    };

    getUser();

    // Subscribe to real-time updates for participants
    const participantsChannel = supabase
      .channel(`quiz_session_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'quiz_session_participants',
          filter: `session_id=eq.${sessionId}`,
        },
        () => {
          fetchParticipants();
        }
      )
      .subscribe();

    // Subscribe to session status changes
    const sessionChannel = supabase
      .channel(`quiz_session_status_${sessionId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'quiz_sessions',
          filter: `id=eq.${sessionId}`,
        },
        (payload) => {
          if (payload.new.status === 'active') {
            // Redirect to exam when session becomes active
            router.push(`/dashboard/student/quiz/exam?session=${sessionId}`);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(participantsChannel);
      supabase.removeChannel(sessionChannel);
    };
  }, [router, sessionId]);

  const fetchSession = async () => {
    try {
      const { data, error } = await supabase
        .from('quiz_sessions')
        .select(`
          id,
          quiz_code,
          title,
          subject,
          status,
          course:courses(name)
        `)
        .eq('id', sessionId)
        .single();

      if (error) {
        console.error('Error fetching session:', error);
        return;
      }

      // Transform the course array to a single object if it's an array
      if (data) {
        const transformedData = {
          ...data,
          course: Array.isArray(data.course) && data.course.length > 0 
            ? data.course[0] 
            : data.course
        };
        setSession(transformedData as Session);
      }
    } catch (error) {
      console.error('Error fetching session:', error);
    }
  };

  const fetchParticipants = async () => {
    try {
      // First, fetch participants
      const { data: participantsData, error: participantsError } = await supabase
        .from('quiz_session_participants')
        .select('id, student_id, joined_at, status')
        .eq('session_id', sessionId)
        .order('joined_at', { ascending: true });

      if (participantsError) {
        console.error('Error fetching participants:', participantsError);
        return;
      }

      if (!participantsData || participantsData.length === 0) {
        setParticipants([]);
        return;
      }

      // Then, fetch profiles for all participants
      const studentIds = participantsData.map(p => p.student_id);
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('id, full_name, email')
        .in('id', studentIds);

      if (profilesError) {
        console.error('Error fetching profiles:', profilesError);
        // Still set participants even if profiles fail
        setParticipants(participantsData.map(p => ({
          ...p,
          profile: undefined
        })) as Participant[]);
        return;
      }

      // Combine participants with their profiles
      const participantsWithProfiles = participantsData.map(participant => {
        const profile = profilesData?.find(p => p.id === participant.student_id);
        return {
          ...participant,
          profile: profile ? {
            full_name: profile.full_name,
            email: profile.email
          } : undefined
        };
      });

      setParticipants(participantsWithProfiles as Participant[]);
    } catch (error) {
      console.error('Error fetching participants:', error);
    }
  };

  const getInitials = (name?: string, email?: string) => {
    if (name) {
      const parts = name.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return name.substring(0, 2).toUpperCase();
    }
    if (email) {
      return email.substring(0, 2).toUpperCase();
    }
    return '??';
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading lobby...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-2xl"
      >
        <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
          {/* Header */}
          <div className="mb-6">
            <Link
              href="/dashboard/student/quiz/enter"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Link>
            <div className="text-center">
              <h1 className="text-2xl font-semibold mb-2">{session?.title || 'Quiz Lobby'}</h1>
              <div className="flex items-center justify-center gap-2 flex-wrap">
                {session?.course && (
                  <Badge variant="secondary">{session.course.name}</Badge>
                )}
                {session?.subject && (
                  <span className="text-sm text-muted-foreground">{session.subject}</span>
                )}
                <span className="text-sm font-mono text-muted-foreground">Code: {quizCode}</span>
              </div>
            </div>
          </div>

          <Separator className="mb-6" />

          {/* Waiting Message */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <Loader2 className="h-8 w-8 text-primary animate-spin" />
            </div>
            <h2 className="text-lg font-semibold mb-2">Waiting for quiz to start</h2>
            <p className="text-sm text-muted-foreground">
              Your professor will start the quiz when everyone is ready
            </p>
          </div>

          {/* Participants List */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-muted-foreground" />
                <h3 className="font-semibold">Participants</h3>
              </div>
              <Badge variant="secondary">{participants.length}</Badge>
            </div>

            <div className="space-y-2 max-h-64 overflow-y-auto">
              <AnimatePresence>
                {participants.map((participant, index) => {
                  const studentName = participant.profile?.full_name || 
                                    participant.profile?.email?.split('@')[0] || 
                                    'Student';
                  const studentEmail = participant.profile?.email || '';
                  const isCurrentUser = participant.student_id === user?.id;

                  return (
                    <motion.div
                      key={participant.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      className={`flex items-center gap-3 p-3 rounded-lg border ${
                        isCurrentUser 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-background border-border'
                      }`}
                    >
                      <Avatar 
                        className="h-10 w-10"
                        fallback={getInitials(studentName, studentEmail)}
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {studentName}
                          {isCurrentUser && (
                            <span className="ml-2 text-xs text-muted-foreground">(You)</span>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground truncate">{studentEmail}</p>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Waiting
                      </Badge>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>
          </div>

          {/* Info */}
          <div className="p-4 rounded-lg bg-muted/50 text-center">
            <p className="text-sm text-muted-foreground">
              You will be automatically redirected when the quiz starts
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default function QuizLobbyPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-2" />
          <p className="text-sm text-muted-foreground">Loading lobby...</p>
        </div>
      </div>
    }>
      <QuizLobbyContent />
    </Suspense>
  );
}

