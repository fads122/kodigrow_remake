'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { BookOpen, Search, Plus, ArrowRight, Copy, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { JoinCourseModal } from './JoinCourseModal';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

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
  description?: string;
  color: string;
  class_code: string;
  professor_id: string;
}

export default function StudentCoursesPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isJoinModalOpen, setIsJoinModalOpen] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const fetchCourses = async (studentId: string) => {
    try {
      console.log('Fetching courses for student ID:', studentId);

      // Use RPC function to get enrolled courses (bypasses RLS issues)
      const { data: coursesData, error: coursesError } = await supabase
        .rpc('get_student_courses');

      console.log('Courses response (RPC):', { data: coursesData, error: coursesError });

      if (coursesError) {
        console.error('Error fetching courses via RPC:', coursesError);
        // Fallback: try fetching enrollments and courses separately
        const { data: enrollments, error: enrollmentsError } = await supabase
          .from('course_enrollments')
          .select('course_id')
          .eq('student_id', studentId);

        if (enrollmentsError || !enrollments || enrollments.length === 0) {
          setCourses([]);
          return;
        }

        const courseIds = enrollments.map(e => e.course_id);
        // Try to fetch courses one by one
        const coursesPromises = courseIds.map(courseId =>
          supabase
            .from('courses')
            .select('*')
            .eq('id', courseId)
            .single()
        );

        const results = await Promise.all(coursesPromises);
        const validCourses = results
          .filter(result => result.data && !result.error)
          .map(result => result.data);

        setCourses(validCourses);
        return;
      }

      // Set courses from RPC result
      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

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
      await fetchCourses(user.id);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const filteredCourses = courses.filter(course =>
    course.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    course.subject?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const handleCourseJoined = async () => {
    if (user) {
      // Wait a moment for the enrollment to be fully processed
      await new Promise(resolve => setTimeout(resolve, 500));
      await fetchCourses(user.id);
    }
  };

  const handleCopyCode = async (code: string) => {
    await navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">My Courses</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {courses.length} {courses.length === 1 ? 'course' : 'courses'} enrolled
          </p>
        </div>
        <motion.button
          whileHover={{ y: -1 }}
          onClick={() => setIsJoinModalOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Join Course
        </motion.button>
      </div>

      <Separator />

      {/* Search Bar */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="Search courses..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 text-sm"
        />
      </div>

      {/* Courses Grid */}
      {filteredCourses.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredCourses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.03 }}
              className="group relative overflow-hidden rounded-lg border border-border bg-card hover:border-primary/50 hover:shadow-md transition-all"
            >
              <a
                href={`/dashboard/student/courses/${course.id}`}
                className="block"
              >
                {/* Course Header */}
                <div className="p-5 pb-4">
                  <div className="flex items-start gap-4 mb-4">
                    <div className="h-12 w-12 rounded-lg flex items-center justify-center flex-shrink-0 bg-muted">
                      <BookOpen 
                        className="h-6 w-6" 
                        style={{ color: course.color || '#4285F4' }}
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-base mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                        {course.name}
                      </h3>
                      {course.subject && (
                        <Badge variant="secondary" className="text-xs mt-1">
                          {course.subject}
                        </Badge>
                      )}
                    </div>
                  </div>
                  
                  {course.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2 mb-4">
                      {course.description}
                    </p>
                  )}
                </div>

                <Separator />

                {/* Class Code Section */}
                <div className="p-5 pt-4">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium text-muted-foreground mb-1.5">
                        Class Code
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-sm font-mono font-semibold text-foreground">
                          {course.class_code}
                        </code>
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleCopyCode(course.class_code);
                          }}
                          className="p-1 rounded hover:bg-muted transition-colors"
                          title="Copy class code"
                        >
                          {copiedCode === course.class_code ? (
                            <Check className="h-3.5 w-3.5 text-green-600" />
                          ) : (
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="px-5 pb-4">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                    <span className="font-medium">View Course</span>
                    <ArrowRight className="h-3 w-3" />
                  </div>
                </div>
              </a>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card p-12 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
            <BookOpen className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="text-base font-semibold mb-2">
            {searchQuery ? 'No courses found' : 'No courses enrolled'}
          </h3>
          <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
            {searchQuery 
              ? 'Try adjusting your search terms to find what you\'re looking for.'
              : 'Get started by joining a course using a class code from your professor.'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setIsJoinModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Join Course
            </button>
          )}
        </div>
      )}

      <JoinCourseModal
        isOpen={isJoinModalOpen}
        onClose={() => setIsJoinModalOpen(false)}
        onCourseJoined={handleCourseJoined}
      />
    </div>
  );
}

