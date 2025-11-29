'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Plus, BookOpen, Users, Copy, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateCourseModal } from './CreateCourseModal';
import { Button } from '@/components/ui/button';

interface Course {
  id: string;
  name: string;
  description: string | null;
  subject: string | null;
  room: string | null;
  class_code: string;
  color: string;
  created_at: string;
  student_count?: number;
}

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    account_type?: string;
  };
}

export default function CoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
      console.log('Fetching courses for professor ID:', professorId);

      // First verify the current user
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      console.log('Current authenticated user:', currentUser?.id);
      console.log('Professor ID from props:', professorId);
      console.log('User IDs match:', currentUser?.id === professorId);

      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('*')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });

      console.log('Courses response:', { data: coursesData, error: coursesError });

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        setError(coursesError.message || 'Failed to load courses');
        setCourses([]);
        return;
      }

      if (!coursesData || coursesData.length === 0) {
        console.log('No courses found in database');
        setCourses([]);
        setError(null);
        return;
      }

      console.log(`Found ${coursesData.length} courses`);

      const coursesWithCounts = await Promise.all(
        coursesData.map(async (course) => {
          const { count } = await supabase
            .from('course_enrollments')
            .select('*', { count: 'exact', head: true })
            .eq('course_id', course.id);

          return {
            ...course,
            student_count: count || 0,
          };
        })
      );

      console.log('Courses with counts:', coursesWithCounts);
      setCourses(coursesWithCounts);
      setError(null);
    } catch (error: unknown) {
      console.error('Exception in fetchCourses:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to load courses';
      setError(errorMessage);
      setCourses([]);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopiedCode(code);
      setTimeout(() => setCopiedCode(null), 2000);
    } catch (error) {
      console.error('Failed to copy code:', error);
    }
  };

  const handleDeleteCourse = async (courseId: string) => {
    if (!confirm('Are you sure you want to delete this course? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', courseId);

      if (error) throw error;

      setCourses(courses.filter(c => c.id !== courseId));
    } catch (error) {
      console.error('Error deleting course:', error);
      alert('Failed to delete course. Please try again.');
    }
  };

  const handleCourseCreated = async () => {
    console.log('Course created, refreshing list...');
    if (user) {
      await fetchCourses(user.id);
    } else {
      // Get user again if not available
      const { data: { user: currentUser } } = await supabase.auth.getUser();
      if (currentUser) {
        setUser(currentUser);
        await fetchCourses(currentUser.id);
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading courses...</div>
      </div>
    );
  }

  const courseColors = [
    '#4285F4', // Blue
    '#34A853', // Green
    '#FBBC04', // Yellow
    '#EA4335', // Red
    '#9C27B0', // Purple
    '#FF9800', // Orange
    '#00BCD4', // Cyan
    '#E91E63', // Pink
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Courses</h1>
          <p className="text-muted-foreground mt-1">
            Manage your classes and share class codes with students
          </p>
        </div>
        <Button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Course
        </Button>
      </div>

      {error && (
        <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* Courses Grid - Google Classroom Style */}
      {courses.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-16 rounded-xl border border-border/50 bg-card/50"
        >
          <BookOpen className="h-16 w-16 text-muted-foreground mb-4" />
          <h3 className="text-xl font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-6">Create your first course to get started</p>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Course
          </Button>
        </motion.div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-2xl border border-border/50 bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer hover:-translate-y-1"
            >
              {/* Color Header with Gradient */}
              <div
                className="h-32 w-full relative overflow-hidden"
                style={{ backgroundColor: course.color || courseColors[index % courseColors.length] }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent" />

                {/* Course Icon/Initial */}
                <div className="absolute bottom-4 left-4">
                  <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                    <BookOpen className="h-6 w-6 text-white" />
                  </div>
                </div>

                {/* Delete Button */}
                <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteCourse(course.id);
                    }}
                    className="p-2 rounded-lg bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white transition-colors"
                    title="Delete course"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Course Content */}
              <div className="p-5">
                <div className="mb-4">
                  <h3 className="font-bold text-xl mb-1.5 line-clamp-2 text-foreground">
                    {course.name}
                  </h3>
                  {course.subject && (
                    <p className="text-sm font-medium text-muted-foreground mb-2">{course.subject}</p>
                  )}
                  {course.room && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <div className="w-1 h-1 rounded-full bg-muted-foreground" />
                      <span>{course.room}</span>
                    </div>
                  )}
                </div>

                {/* Class Code - Modern Design */}
                <div className="mb-4 p-3 rounded-xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50 backdrop-blur-sm">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex-1">
                      <p className="text-xs text-muted-foreground mb-1 font-medium">Class Code</p>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-mono font-bold text-foreground tracking-wider">
                          {course.class_code}
                        </span>
                        {copiedCode === course.class_code && (
                          <span className="text-xs text-green-500 font-medium">Copied!</span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleCopyCode(course.class_code);
                      }}
                      className="p-2 rounded-lg hover:bg-background/50 transition-colors shrink-0"
                      title={copiedCode === course.class_code ? 'Copied!' : 'Copy class code'}
                    >
                      <Copy className={`h-4 w-4 ${copiedCode === course.class_code ? 'text-green-500' : 'text-muted-foreground'}`} />
                    </button>
                  </div>
                </div>

                {/* Student Count - Modern Badge */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-primary/10 text-primary">
                    <Users className="h-4 w-4" />
                    <span className="text-sm font-semibold">{course.student_count || 0}</span>
                    <span className="text-xs text-primary/70">students</span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <CreateCourseModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCourseCreated={handleCourseCreated}
      />
    </div>
  );
}

