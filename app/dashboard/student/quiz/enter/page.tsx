'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { ArrowRight, AlertCircle, HelpCircle } from 'lucide-react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';

export default function EnterQuizPage() {
  const router = useRouter();
  const [quizCode, setQuizCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // Get current user first
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is a student
      const accountType = user.user_metadata?.account_type;
      if (accountType === 'professor') {
        setError('Only students can enter quizzes.');
        setLoading(false);
        return;
      }

      const upperCode = quizCode.toUpperCase();

      // First, check if a session already exists
      const { data: existingSession } = await supabase
        .from('quiz_sessions')
        .select('id, course_id, title, subject, professor_id, status')
        .eq('quiz_code', upperCode)
        .maybeSingle();

      let sessionId: string;
      let sessionData: { course_id: string; title: string; subject: string | null; professor_id: string };

      if (existingSession) {
        // Session exists, use it
        sessionId = existingSession.id;
        sessionData = {
          course_id: existingSession.course_id,
          title: existingSession.title,
          subject: existingSession.subject,
          professor_id: existingSession.professor_id,
        };
      } else {
        // No session exists, check if quiz code is valid
        // Try to find a question with this code to get quiz details
        const { data: questionData, error: questionError } = await supabase
          .from('multiple_choice_questions')
          .select('course_id, title, subject, professor_id')
          .eq('quiz_code', upperCode)
          .limit(1)
          .maybeSingle();

        if (questionError || !questionData) {
          console.error('Quiz code check error:', questionError);
          setError('Invalid quiz code. Please check and try again.');
          setLoading(false);
          return;
        }

        // Create a new session for this quiz
        const { data: newSession, error: sessionError } = await supabase
          .from('quiz_sessions')
          .insert({
            quiz_code: upperCode,
            professor_id: questionData.professor_id,
            course_id: questionData.course_id,
            title: questionData.title,
            subject: questionData.subject,
            status: 'waiting',
          })
          .select('id')
          .single();

        if (sessionError || !newSession) {
          console.error('Session creation error:', sessionError);
          setError('Failed to create quiz session. Please try again.');
          setLoading(false);
          return;
        }

        sessionId = newSession.id;
        sessionData = {
          course_id: questionData.course_id,
          title: questionData.title,
          subject: questionData.subject,
          professor_id: questionData.professor_id,
        };
      }

      // Check if student is already in the session
      const { data: existingParticipant } = await supabase
        .from('quiz_session_participants')
        .select('id')
        .eq('session_id', sessionId)
        .eq('student_id', user.id)
        .maybeSingle();

      if (!existingParticipant) {
        // Join the session
        const { error: joinError } = await supabase
          .from('quiz_session_participants')
          .insert({
            session_id: sessionId,
            student_id: user.id,
            status: 'waiting',
          });

        if (joinError) {
          throw joinError;
        }
      }

      // Redirect to lobby
      router.push(`/dashboard/student/quiz/lobby?session=${sessionId}&code=${upperCode}`);
    } catch (error: unknown) {
      console.error('Error entering quiz:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to enter quiz. Please try again.';
      setError(errorMessage);
      setLoading(false);
    }
  };

  return (
    <div className="flex-1 flex items-center justify-center min-h-[calc(100vh-4rem)] -m-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md mx-auto p-4"
      >
        <div className="rounded-lg border border-border bg-card p-8 shadow-lg">
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
              <HelpCircle className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-semibold mb-2">Enter Quiz</h1>
            <p className="text-sm text-muted-foreground">
              Enter the quiz code provided by your professor
            </p>
          </div>

          <Separator className="mb-6" />

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive">
                <AlertCircle className="h-4 w-4" />
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium mb-2">
                Quiz Code
              </label>
              <input
                type="text"
                value={quizCode}
                onChange={(e) => setQuizCode(e.target.value.toUpperCase())}
                placeholder="Enter 6-digit code"
                maxLength={6}
                className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-center text-2xl font-mono tracking-widest uppercase"
                required
                disabled={loading}
              />
            </div>

            <motion.button
              type="submit"
              whileHover={{ y: -1 }}
              whileTap={{ scale: 0.98 }}
              disabled={loading || quizCode.length !== 6}
              className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                  Entering...
                </>
              ) : (
                <>
                  Enter Quiz
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

