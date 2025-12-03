'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { ArrowLeft, HelpCircle, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    account_type?: string;
  };
}

interface Course {
  id: string;
  name: string;
  subject: string;
  color: string;
}

interface Question {
  id: string;
  professor_id: string;
  course_id: string;
  subject: string | null;
  title: string;
  question: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct_answer: 'A' | 'B' | 'C' | 'D';
  created_at: string;
  updated_at: string;
  course?: Course | null;
}

function QuizDetailContent({ params }: { params: Promise<{ title: string }> }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [title, setTitle] = useState('');
  const courseId = searchParams.get('course') || '';
  const subject = searchParams.get('subject') || '';

  useEffect(() => {
    params.then((p) => {
      setTitle(decodeURIComponent(p.title));
    });
  }, [params]);

  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [course, setCourse] = useState<Course | null>(null);

  useEffect(() => {
    const getUser = async () => {
      if (!title) return; // Wait for title to be decoded

      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        router.push('/login');
        return;
      }

      const accountType = user.user_metadata?.account_type;
      if (accountType !== 'professor') {
        router.push('/dashboard');
        return;
      }

      setUser(user);
      await Promise.all([
        fetchCourse(courseId),
        fetchQuestions(user.id)
      ]);
      setLoading(false);
    };

    getUser();
  }, [router, courseId, title]);

  const fetchCourse = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('id, name, subject, color')
        .eq('id', id)
        .single();

      if (error) {
        console.error('Error fetching course:', error);
        return;
      }

      setCourse(data);
    } catch (error) {
      console.error('Error fetching course:', error);
    }
  };

  const fetchQuestions = async (professorId: string) => {
    try {
      const { data: questionsData, error: questionsError } = await supabase
        .from('multiple_choice_questions')
        .select(`
          *,
          course:courses(id, name, subject, color)
        `)
        .eq('professor_id', professorId)
        .eq('title', title)
        .eq('course_id', courseId)
        .order('created_at', { ascending: true });

      if (questionsError) {
        console.error('Error fetching questions:', questionsError);
        setQuestions([]);
        return;
      }

      const transformedQuestions: Question[] = (questionsData || []).map((q: unknown) => {
        const question = q as {
          id: string;
          professor_id: string;
          course_id: string;
          subject: string | null;
          title: string;
          question: string;
          option_a: string;
          option_b: string;
          option_c: string;
          option_d: string;
          correct_answer: 'A' | 'B' | 'C' | 'D';
          created_at: string;
          updated_at: string;
          course?: Course | null;
        };
        return {
          id: question.id,
          professor_id: question.professor_id,
          course_id: question.course_id,
          subject: question.subject,
          title: question.title,
          question: question.question,
          option_a: question.option_a,
          option_b: question.option_b,
          option_c: question.option_c,
          option_d: question.option_d,
          correct_answer: question.correct_answer,
          created_at: question.created_at,
          updated_at: question.updated_at,
          course: question.course || undefined,
        };
      });

      setQuestions(transformedQuestions);
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    }
  };

  const handleDeleteQuestion = async (questionId: string) => {
    if (!confirm('Are you sure you want to delete this question?')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('multiple_choice_questions')
        .delete()
        .eq('id', questionId);

      if (error) {
        throw error;
      }

      // Refresh questions
      if (user) {
        await fetchQuestions(user.id);
      }
    } catch (error) {
      console.error('Error deleting question:', error);
      alert('Failed to delete question. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/professor/questions"
          className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold tracking-tight">{title || 'Loading...'}</h1>
          <div className="flex items-center gap-2 mt-1">
            {course && (
              <Badge variant="secondary" className="text-xs">
                {course.name}
              </Badge>
            )}
            {subject && (
              <span className="text-sm text-muted-foreground">{subject}</span>
            )}
            <span className="text-sm text-muted-foreground">
              • {questions.length} {questions.length === 1 ? 'question' : 'questions'}
            </span>
          </div>
        </div>
      </div>

      <Separator />

      {/* Questions List */}
      {questions.length > 0 ? (
        <div className="space-y-6">
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <h3 className="font-semibold">Question {index + 1}</h3>
                </div>
                <button
                  onClick={() => handleDeleteQuestion(question.id)}
                  className="p-2 rounded-lg border border-border bg-background hover:bg-destructive/10 hover:border-destructive/50 transition-colors"
                  title="Delete question"
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </button>
              </div>

              <p className="text-sm text-foreground mb-4">{question.question}</p>

              <div className="grid grid-cols-2 gap-3">
                {([
                  { letter: 'A' as const, option: question.option_a },
                  { letter: 'B' as const, option: question.option_b },
                  { letter: 'C' as const, option: question.option_c },
                  { letter: 'D' as const, option: question.option_d },
                ]).map(({ letter, option }) => (
                  <div
                    key={letter}
                    className={`p-3 rounded-lg border ${
                      question.correct_answer === letter
                        ? 'bg-green-500/10 border-green-500/20'
                        : 'bg-background border-border'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`font-medium text-sm ${
                        question.correct_answer === letter ? 'text-green-600' : 'text-foreground'
                      }`}>
                        {letter}: {option}
                      </span>
                      {question.correct_answer === letter && (
                        <Badge variant="outline" className="text-xs bg-green-500/10 border-green-500/20 text-green-600">
                          Correct
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <HelpCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">No questions found</h3>
          <p className="text-sm text-muted-foreground">
            This quiz doesn't have any questions yet.
          </p>
        </div>
      )}
    </div>
  );
}

export default function QuizDetailPage({ params }: { params: Promise<{ title: string }> }) {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    }>
      <QuizDetailContent params={params} />
    </Suspense>
  );
}

