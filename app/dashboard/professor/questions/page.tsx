'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Plus, Search, Trash2, HelpCircle, ArrowRight, Copy, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
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

interface QuizSet {
  title: string;
  course_id: string;
  subject: string | null;
  course?: Course | null;
  created_at: string;
  quiz_code: string | null;
  questions: Question[];
}

export default function QuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [quizSets, setQuizSets] = useState<QuizSet[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [courses, setCourses] = useState<Course[]>([]);

  useEffect(() => {
    const getUser = async () => {
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
        fetchCourses(user.id),
        fetchQuestions(user.id)
      ]);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const fetchCourses = async (professorId: string) => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, subject, color')
        .eq('professor_id', professorId)
        .order('name', { ascending: true });

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        setCourses([]);
        return;
      }

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
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
        .order('created_at', { ascending: false });

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
          quiz_code: string | null;
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

      // Group questions by title, course_id, and subject
      const grouped = transformedQuestions.reduce((acc, question) => {
        const key = `${question.title}|${question.course_id}|${question.subject || ''}`;
        if (!acc[key]) {
          // Get quiz_code from raw questionsData
          const rawQuestion = (questionsData || []).find((q: unknown) => {
            const qData = q as {
              title: string;
              course_id: string;
              subject: string | null;
            };
            return qData.title === question.title &&
              qData.course_id === question.course_id &&
              qData.subject === question.subject;
          }) as { quiz_code?: string | null } | undefined;

          acc[key] = {
            title: question.title,
            course_id: question.course_id,
            subject: question.subject,
            course: question.course,
            created_at: question.created_at,
            quiz_code: rawQuestion?.quiz_code || null,
            questions: [],
          };
        }
        acc[key].questions.push(question);
        return acc;
      }, {} as Record<string, QuizSet>);

      setQuizSets(Object.values(grouped).sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));
    } catch (error) {
      console.error('Error fetching questions:', error);
      setQuestions([]);
    }
  };

  const handleDeleteQuiz = async (quizSet: QuizSet) => {
    if (!confirm(`Are you sure you want to delete this quiz "${quizSet.title}"? This will delete all ${quizSet.questions.length} questions.`)) {
      return;
    }

    try {
      const questionIds = quizSet.questions.map(q => q.id);
      const { error } = await supabase
        .from('multiple_choice_questions')
        .delete()
        .in('id', questionIds);

      if (error) {
        throw error;
      }

      // Refresh questions
      if (user) {
        await fetchQuestions(user.id);
      }
    } catch (error) {
      console.error('Error deleting quiz:', error);
      alert('Failed to delete quiz. Please try again.');
    }
  };

  const generateQuizCode = async (quizSet: QuizSet) => {
    if (!user) return;

    try {
      const questionIds = quizSet.questions.map(q => q.id);

      // Use database function to assign code atomically
      const { data: quizCode, error: rpcError } = await supabase
        .rpc('assign_quiz_code_to_questions', {
          question_ids: questionIds,
          existing_code: null
        });

      if (rpcError) {
        throw rpcError;
      }

      if (!quizCode) {
        throw new Error('Failed to generate quiz code');
      }

      // Refresh questions
      await fetchQuestions(user.id);
    } catch (error) {
      console.error('Error generating quiz code:', error);
      alert('Failed to generate quiz code. Please try again.');
    }
  };

  const copyQuizCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const filteredQuizSets = quizSets.filter(quizSet => {
    const matchesSearch =
      quizSet.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quizSet.subject?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      quizSet.course?.name.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourse === 'all' || quizSet.course_id === selectedCourse;

    return matchesSearch && matchesCourse;
  });

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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Multiple Choice Questions</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View and manage your multiple choice questions
          </p>
        </div>
        <Link href="/dashboard/professor/questions/create">
          <motion.button
            whileHover={{ y: -1 }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Questions
          </motion.button>
        </Link>
      </div>

      <Separator />

      {/* Search and Filter */}
      <div className="flex gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search questions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
        >
          <option value="all">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Quiz Sets List */}
      {filteredQuizSets.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <AnimatePresence>
            {filteredQuizSets.map((quizSet, index) => (
              <motion.div
                key={`${quizSet.title}-${quizSet.course_id}-${quizSet.subject || ''}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2, delay: index * 0.03 }}
                className="group relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all"
              >
                <Link href={`/dashboard/professor/questions/${encodeURIComponent(quizSet.title)}?course=${quizSet.course_id}&subject=${encodeURIComponent(quizSet.subject || '')}`}>
                  <div className="p-6">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-primary/10">
                        <HelpCircle className="h-6 w-6 text-primary" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                          {quizSet.title}
                        </h3>
                        {quizSet.course && (
                          <Badge variant="secondary" className="text-xs mt-1">
                            {quizSet.course.name}
                          </Badge>
                        )}
                      </div>
                    </div>

                    {quizSet.subject && (
                      <p className="text-sm text-muted-foreground mb-4">{quizSet.subject}</p>
                    )}

                    <Separator className="mb-4" />

                    {/* Quiz Code */}
                    <div className="mb-4">
                      {quizSet.quiz_code ? (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted">
                          <span className="text-sm font-mono font-semibold">{quizSet.quiz_code}</span>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              copyQuizCode(quizSet.quiz_code || '');
                            }}
                            className="p-1 rounded hover:bg-background transition-colors"
                            title="Copy code"
                          >
                            <Copy className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            generateQuizCode(quizSet);
                          }}
                          className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm"
                        >
                          <RefreshCw className="h-4 w-4" />
                          Generate Code
                        </button>
                      )}
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <span className="font-medium">{quizSet.questions.length}</span>
                        <span>{quizSet.questions.length === 1 ? 'question' : 'questions'}</span>
                      </div>
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <span className="text-xs">View</span>
                        <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </div>
                    </div>

                    <p className="text-xs text-muted-foreground mt-2">
                      Created {new Date(quizSet.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </Link>
                <div className="absolute top-4 right-4 flex gap-2">
                  {quizSet.quiz_code && (
                    <button
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        generateQuizCode(quizSet);
                      }}
                      className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
                      title="Regenerate code"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </button>
                  )}
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleDeleteQuiz(quizSet);
                    }}
                    className="p-2 rounded-lg border border-border bg-background hover:bg-destructive/10 hover:border-destructive/50 transition-colors"
                    title="Delete quiz"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <HelpCircle className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">
            {searchQuery || selectedCourse !== 'all' ? 'No quizzes found' : 'No quizzes created'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery || selectedCourse !== 'all'
              ? 'Try adjusting your search or filter to find what you\'re looking for.'
              : 'Get started by creating your first quiz with multiple choice questions.'}
          </p>
          {!searchQuery && selectedCourse === 'all' && (
            <Link href="/dashboard/professor/questions/create">
              <button className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors">
                <Plus className="h-4 w-4" />
                Create Questions
              </button>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
