'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../../lib/supabase';
import { Plus, Trash2, Save, AlertCircle, CheckCircle2, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
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

interface QuestionEntry {
  id: string;
  question: string;
  optionA: string;
  optionB: string;
  optionC: string;
  optionD: string;
  correctAnswer: 'A' | 'B' | 'C' | 'D';
}

export default function CreateQuestionsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [quizInfo, setQuizInfo] = useState({
    courseId: '',
    subject: '',
    title: '',
  });
  const [questions, setQuestions] = useState<QuestionEntry[]>([
    {
      id: Date.now().toString(),
      question: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctAnswer: 'A',
    },
  ]);

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
      await fetchCourses(user.id);
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

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        id: Date.now().toString(),
        question: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctAnswer: 'A',
      },
    ]);
  };

  const removeQuestion = (id: string) => {
    if (questions.length > 1) {
      setQuestions(questions.filter(q => q.id !== id));
    }
  };

  const updateQuestion = (id: string, field: keyof QuestionEntry, value: string | 'A' | 'B' | 'C' | 'D') => {
    setQuestions(questions.map(q => {
      if (q.id === id) {
        if (field === 'correctAnswer') {
          return { ...q, correctAnswer: value as 'A' | 'B' | 'C' | 'D' };
        }
        return { ...q, [field]: value };
      }
      return q;
    }));
  };

  const validateQuestions = (): boolean => {
    if (!quizInfo.courseId || !quizInfo.title) {
      return false;
    }
    for (const q of questions) {
      if (!q.question || !q.optionA || !q.optionB || !q.optionC || !q.optionD) {
        return false;
      }
    }
    return true;
  };

  const handleSubmit = async () => {
    if (!user) {
      setError('You must be logged in to create questions');
      return;
    }

    if (!validateQuestions()) {
      setError('Please fill in all required fields for all questions');
      return;
    }

    setSubmitting(true);
    setError(null);
    setSuccess(null);

    try {
      // Generate a unique quiz code
      const generateCode = () => {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 6; i++) {
          code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
      };

      let quizCode = generateCode();

      // Check if code exists and regenerate if needed
      let codeExists = true;
      let attempts = 0;
      while (codeExists && attempts < 10) {
        const { data: existing } = await supabase
          .from('multiple_choice_questions')
          .select('id')
          .eq('quiz_code', quizCode)
          .limit(1)
          .single();

        if (!existing) {
          codeExists = false;
        } else {
          quizCode = generateCode();
          attempts++;
        }
      }

      const questionsToInsert = questions.map(q => ({
        professor_id: user.id,
        course_id: quizInfo.courseId,
        subject: quizInfo.subject || null,
        title: quizInfo.title,
        question: q.question,
        option_a: q.optionA,
        option_b: q.optionB,
        option_c: q.optionC,
        option_d: q.optionD,
        correct_answer: q.correctAnswer,
        quiz_code: quizCode,
      }));

      const { error: insertError } = await supabase
        .from('multiple_choice_questions')
        .insert(questionsToInsert);

      if (insertError) {
        throw insertError;
      }

      setSuccess(`Successfully created ${questions.length} question${questions.length === 1 ? '' : 's'}!`);

      // Reset form
      setQuizInfo({
        courseId: '',
        subject: '',
        title: '',
      });
      setQuestions([
        {
          id: Date.now().toString(),
          question: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctAnswer: 'A',
        },
      ]);

      // Redirect after 2 seconds
      setTimeout(() => {
        router.push('/dashboard/professor/questions');
      }, 2000);
    } catch (error: unknown) {
      console.error('Error creating questions:', error);
      const errorMessage = error instanceof Error
        ? error.message
        : 'Failed to create questions. Please try again.';
      setError(errorMessage);
    } finally {
      setSubmitting(false);
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
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/professor/questions"
            className="p-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Create Questions</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Add multiple choice questions for your courses
            </p>
          </div>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          onClick={addQuestion}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Add Question
        </motion.button>
      </div>

      <Separator />

      {/* Success/Error Messages */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 flex items-center gap-2 text-sm text-destructive"
          >
            <AlertCircle className="h-4 w-4" />
            {error}
          </motion.div>
        )}
        {success && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="p-4 rounded-lg bg-green-500/10 border border-green-500/20 flex items-center gap-2 text-sm text-green-600"
          >
            <CheckCircle2 className="h-4 w-4" />
            {success}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quiz Info Card */}
      <div className="rounded-lg border border-border bg-card p-6">
        <h3 className="font-semibold mb-4">Quiz Information</h3>
        <div className="grid gap-4 md:grid-cols-2">
          {/* Course Selection */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Course <span className="text-destructive">*</span>
            </label>
            <select
              value={quizInfo.courseId}
              onChange={(e) => setQuizInfo({ ...quizInfo, courseId: e.target.value })}
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
            >
              <option value="">Select a course</option>
              {courses.map(course => (
                <option key={course.id} value={course.id}>
                  {course.name}
                </option>
              ))}
            </select>
          </div>

          {/* Subject */}
          <div>
            <label className="block text-sm font-medium mb-2">Subject</label>
            <input
              type="text"
              value={quizInfo.subject}
              onChange={(e) => setQuizInfo({ ...quizInfo, subject: e.target.value })}
              placeholder="e.g., Mathematics, Science"
              className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
            />
          </div>
        </div>

        {/* Title */}
        <div className="mt-4">
          <label className="block text-sm font-medium mb-2">
            Quiz Title <span className="text-destructive">*</span>
          </label>
          <input
            type="text"
            value={quizInfo.title}
            onChange={(e) => setQuizInfo({ ...quizInfo, title: e.target.value })}
            placeholder="Enter quiz title"
            className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
          />
        </div>
      </div>

      {/* Questions Form */}
      <div className="space-y-6">
        <AnimatePresence>
          {questions.map((question, index) => (
            <motion.div
              key={question.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="rounded-lg border border-border bg-card p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-semibold text-primary">{index + 1}</span>
                  </div>
                  <h3 className="font-semibold">Question {index + 1}</h3>
                </div>
                {questions.length > 1 && (
                  <button
                    onClick={() => removeQuestion(question.id)}
                    className="p-2 rounded-lg border border-border bg-background hover:bg-destructive/10 hover:border-destructive/50 transition-colors"
                    title="Remove question"
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </button>
                )}
              </div>

              {/* Question */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">
                  Question <span className="text-destructive">*</span>
                </label>
                <textarea
                  value={question.question}
                  onChange={(e) => updateQuestion(question.id, 'question', e.target.value)}
                  placeholder="Enter your question"
                  rows={3}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 resize-none text-sm"
                />
              </div>

              {/* Options */}
              <div className="mt-4 grid gap-4 md:grid-cols-2">
                {([
                  { letter: 'A' as const, field: 'optionA' as const },
                  { letter: 'B' as const, field: 'optionB' as const },
                  { letter: 'C' as const, field: 'optionC' as const },
                  { letter: 'D' as const, field: 'optionD' as const },
                ]).map(({ letter, field }) => (
                  <div key={letter}>
                    <label className="block text-sm font-medium mb-2">
                      Option {letter} <span className="text-destructive">*</span>
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={question[field]}
                        onChange={(e) => updateQuestion(question.id, field, e.target.value)}
                        placeholder={`Enter option ${letter}`}
                        className="flex-1 px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
                      />
                      <input
                        type="radio"
                        name={`correct-${question.id}`}
                        checked={question.correctAnswer === letter}
                        onChange={() => updateQuestion(question.id, 'correctAnswer', letter)}
                        className="h-4 w-4 text-primary focus:ring-primary"
                      />
                      <span className="text-xs text-muted-foreground">Correct</span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Submit Button */}
      <div className="sticky bottom-0 bg-background border-t border-border p-4 -mx-6 -mb-6">
        <div className="flex items-center justify-between max-w-7xl mx-auto">
          <Link
            href="/dashboard/professor/questions"
            className="px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors text-sm font-medium"
          >
            Cancel
          </Link>
          <motion.button
            whileHover={{ y: -1 }}
            onClick={handleSubmit}
            disabled={submitting || !validateQuestions()}
            className="flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Submit {questions.length} Question{questions.length === 1 ? '' : 's'}
              </>
            )}
          </motion.button>
        </div>
      </div>
    </div>
  );
}

