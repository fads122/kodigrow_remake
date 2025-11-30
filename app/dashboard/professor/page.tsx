'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { BookOpen, Users, FileText, TrendingUp, Calendar, ArrowRight, Plus, Activity } from 'lucide-react';
import { motion } from 'framer-motion';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    account_type?: string;
    full_name?: string;
  };
}

interface Course {
  id: string;
  name: string;
  subject: string;
  description?: string;
  color: string;
  class_code: string;
  student_count?: number;
}

export default function ProfessorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseCount, setCourseCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignmentsCount, setAssignmentsCount] = useState(0);

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
      await fetchStats(user.id);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const fetchStats = async (professorId: string) => {
    try {
      // Fetch courses
      const { data: coursesData, error: coursesError } = await supabase
        .from('courses')
        .select('id, name, subject, description, color, class_code')
        .eq('professor_id', professorId)
        .order('created_at', { ascending: false });

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        setCourses([]);
        setCourseCount(0);
      } else {
        const coursesList = coursesData || [];
        setCourseCount(coursesList.length);
        
        // Fetch student counts for each course
        const coursesWithCounts = await Promise.all(
          coursesList.map(async (course) => {
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

        setCourses(coursesWithCounts.slice(0, 4)); // Show first 4 courses
      }

      // Fetch total student count across all courses
      const { data: allCourses, error: coursesListError } = await supabase
        .from('courses')
        .select('id')
        .eq('professor_id', professorId);

      if (coursesListError) {
        console.error('Error fetching courses for student count:', coursesListError);
      } else if (allCourses && allCourses.length > 0) {
        const courseIds = allCourses.map(c => c.id);
        const { count: studentsCount, error: studentsError } = await supabase
          .from('course_enrollments')
          .select('*', { count: 'exact', head: true })
          .in('course_id', courseIds);

        if (studentsError) {
          console.error('Error fetching student count:', studentsError);
        } else {
          setStudentCount(studentsCount || 0);
        }
      }

      // Placeholder for assignments (will be implemented later)
      setAssignmentsCount(0);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  const stats = [
    {
      title: 'Active Courses',
      value: courseCount.toString(),
      subtitle: courseCount === 0 ? 'No courses yet' : `${courseCount} ${courseCount === 1 ? 'course' : 'courses'}`,
      icon: BookOpen,
      trend: null,
    },
    {
      title: 'Total Students',
      value: studentCount.toString(),
      subtitle: studentCount === 0 ? 'No students enrolled' : `${studentCount} ${studentCount === 1 ? 'student' : 'students'}`,
      icon: Users,
      trend: null,
    },
    {
      title: 'Pending Assignments',
      value: assignmentsCount.toString(),
      subtitle: assignmentsCount === 0 ? 'All caught up!' : `${assignmentsCount} ${assignmentsCount === 1 ? 'assignment' : 'assignments'}`,
      icon: FileText,
      trend: null,
    },
    {
      title: 'Completion Rate',
      value: '0%',
      subtitle: 'Track progress',
      icon: TrendingUp,
      trend: null,
    },
  ];

  const quickActions = [
    { 
      icon: Plus, 
      label: 'Create Course', 
      description: 'Create a new course',
      href: '/dashboard/professor/courses',
      variant: 'primary' as const,
    },
    { 
      icon: Users, 
      label: 'Manage Students', 
      description: 'View and manage students',
      href: '/dashboard/professor/students',
      variant: 'default' as const,
    },
    { 
      icon: FileText, 
      label: 'Assignments', 
      description: 'Create and manage assignments',
      href: '/dashboard/professor/assignments',
      variant: 'default' as const,
    },
  ];

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Professor';

  return (
    <div className="space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-3xl font-semibold tracking-tight"
        >
          Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-muted-foreground"
        >
          Welcome back, {userName}
        </motion.p>
      </div>

      <Separator />

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-6 transition-all hover:shadow-md hover:border-border/80"
            >
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-2xl font-semibold">{stat.value}</p>
                  <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
                </div>
                <div className="rounded-lg bg-muted p-2.5">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-lg border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">Quick Actions</h2>
            <p className="text-sm text-muted-foreground mt-1">Access frequently used features</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-3">
          {quickActions.map((action, index) => {
            const Icon = action.icon;
            return (
              <motion.a
                key={action.label}
                href={action.href}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.25 + index * 0.05 }}
                whileHover={{ y: -2 }}
                className={`group flex items-center gap-3 rounded-lg border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-sm ${
                  action.variant === 'primary' ? 'bg-primary/5 border-primary/20 hover:bg-primary/10' : ''
                }`}
              >
                <div className={`rounded-md p-2 ${
                  action.variant === 'primary' 
                    ? 'bg-primary/10 text-primary' 
                    : 'bg-muted text-muted-foreground'
                }`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium">{action.label}</p>
                  <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
              </motion.a>
            );
          })}
        </div>
      </motion.div>

      {/* My Courses Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
        className="rounded-lg border border-border bg-card p-6"
      >
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">My Courses</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {courses.length > 0 ? `${courseCount} total course${courseCount === 1 ? '' : 's'}` : 'No courses created'}
            </p>
          </div>
          {courses.length > 0 && (
            <a
              href="/dashboard/professor/courses"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
        
        {courses.length > 0 ? (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <motion.a
                key={course.id}
                href={`/dashboard/professor/courses/${course.id}`}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.35 + index * 0.05 }}
                whileHover={{ y: -2 }}
                className="group relative overflow-hidden rounded-lg border border-border bg-background p-5 transition-all hover:border-primary/50 hover:shadow-sm"
              >
                <div className="flex items-start gap-4">
                  <div
                    className="h-12 w-12 rounded-lg flex-shrink-0 flex items-center justify-center"
                    style={{ backgroundColor: course.color + '20' }}
                  >
                    <BookOpen 
                      className="h-6 w-6" 
                      style={{ color: course.color }}
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm mb-1 line-clamp-2 group-hover:text-primary transition-colors">
                      {course.name}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-3">{course.subject || 'No subject'}</p>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="text-xs">
                        {course.student_count || 0} {course.student_count === 1 ? 'student' : 'students'}
                      </Badge>
                    </div>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-muted mb-4">
              <BookOpen className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-base font-semibold mb-2">No courses created</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Get started by creating your first course to manage students, assignments, and track progress.
            </p>
            <a
              href="/dashboard/professor/courses"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Course
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}

