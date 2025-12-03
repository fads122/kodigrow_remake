'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { BookOpen, FileText, TrendingUp, Calendar, ArrowRight, Plus, Activity } from 'lucide-react';
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
  professor_id: string;
}

export default function StudentDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [enrolledCoursesCount, setEnrolledCoursesCount] = useState(0);
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignmentsCount, setAssignmentsCount] = useState(0);
  const [averageGrade, setAverageGrade] = useState<number | null>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        router.push('/login');
        return;
      }

      // Check if user is a student
      const accountType = user.user_metadata?.account_type;
      if (accountType === 'professor') {
        router.push('/dashboard/professor');
        return;
      }

      setUser(user);
      await fetchStats(user.id);
      setLoading(false);
    };

    getUser();
  }, [router]);

  const fetchStats = async (studentId: string) => {
    try {
      // Fetch enrolled courses
      const { data: enrollments, error: enrollmentsError } = await supabase
        .from('course_enrollments')
        .select('course_id')
        .eq('student_id', studentId);

      if (enrollmentsError) {
        console.error('Error fetching enrollments:', enrollmentsError);
      } else {
        const count = enrollments?.length || 0;
        setEnrolledCoursesCount(count);

        // Fetch course details for enrolled courses
        if (enrollments && enrollments.length > 0) {
          const courseIds = enrollments.map(e => e.course_id);
          const { data: coursesData, error: coursesError } = await supabase
            .from('courses')
            .select('id, name, subject, description, color, professor_id')
            .in('id', courseIds)
            .order('created_at', { ascending: false })
            .limit(4);

          if (coursesError) {
            console.error('Error fetching courses:', coursesError);
          } else {
            setCourses(coursesData || []);
          }
        }
      }

      // Placeholder for assignments (will be implemented later)
      setAssignmentsCount(0);
      setAverageGrade(null);
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
      title: 'Enrolled Courses',
      value: enrolledCoursesCount.toString(),
      subtitle: enrolledCoursesCount === 0 ? 'No courses enrolled' : `${enrolledCoursesCount} ${enrolledCoursesCount === 1 ? 'course' : 'courses'}`,
      icon: BookOpen,
      trend: null,
    },
    {
      title: 'Active Assignments',
      value: assignmentsCount.toString(),
      subtitle: assignmentsCount === 0 ? 'No pending assignments' : `${assignmentsCount} ${assignmentsCount === 1 ? 'assignment' : 'assignments'}`,
      icon: FileText,
      trend: null,
    },
    {
      title: 'Average Grade',
      value: averageGrade !== null ? `${averageGrade.toFixed(1)}%` : '—',
      subtitle: averageGrade !== null ? 'Overall performance' : 'No grades available',
      icon: TrendingUp,
      trend: averageGrade !== null && averageGrade >= 80 ? 'up' : null,
    },
    {
      title: 'Completion Rate',
      value: '0%',
      subtitle: 'Course progress',
      icon: Activity,
      trend: null,
    },
  ];

  const quickActions = [
    { 
      icon: Plus, 
      label: 'Join Course', 
      description: 'Enroll in a new course',
      href: '/dashboard/student/courses',
      variant: 'primary' as const,
    },
    { 
      icon: FileText, 
      label: 'Assignments', 
      description: 'View your assignments',
      href: '/dashboard/student/assignments',
      variant: 'default' as const,
    },
    { 
      icon: Calendar, 
      label: 'Schedule', 
      description: 'View your schedule',
      href: '/dashboard/student/schedule',
      variant: 'default' as const,
    },
  ];

  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Student';

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Header Section */}
      <div className="space-y-2">
        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="text-2xl sm:text-3xl font-semibold tracking-tight"
        >
          Dashboard
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="text-sm sm:text-base text-muted-foreground"
        >
          Welcome back, {userName}
        </motion.p>
      </div>

      <Separator />

      {/* Stats Grid */}
      <div className="grid gap-3 sm:gap-4 grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.05 }}
              className="group relative overflow-hidden rounded-lg border border-border bg-card p-4 sm:p-5 md:p-6 transition-all hover:shadow-md hover:border-border/80"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 min-w-0 flex-1">
                  <p className="text-xs sm:text-sm font-medium text-muted-foreground truncate">{stat.title}</p>
                  <p className="text-xl sm:text-2xl font-semibold">{stat.value}</p>
                  <p className="text-[10px] sm:text-xs text-muted-foreground line-clamp-1">{stat.subtitle}</p>
                </div>
                <div className="rounded-lg bg-muted p-2 sm:p-2.5 flex-shrink-0">
                  <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
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
        className="rounded-lg border border-border bg-card p-4 sm:p-5 md:p-6"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">Quick Actions</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">Access frequently used features</p>
          </div>
        </div>
        <div className="grid gap-2 sm:gap-3 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
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
        className="rounded-lg border border-border bg-card p-4 sm:p-5 md:p-6"
      >
        <div className="flex items-center justify-between mb-4 sm:mb-6">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">My Courses</h2>
            <p className="text-xs sm:text-sm text-muted-foreground mt-1">
              {courses.length > 0 ? `${courses.length} enrolled course${courses.length === 1 ? '' : 's'}` : 'No courses enrolled'}
            </p>
          </div>
          {courses.length > 0 && (
            <a
              href="/dashboard/student/courses"
              className="text-sm font-medium text-primary hover:underline flex items-center gap-1"
            >
              View all
              <ArrowRight className="h-3 w-3" />
            </a>
          )}
        </div>
        
        {courses.length > 0 ? (
          <div className="grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
            {courses.map((course, index) => (
              <motion.a
                key={course.id}
                href={`/dashboard/student/courses/${course.id}`}
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
                    <p className="text-xs text-muted-foreground mb-3">{course.subject}</p>
                    <Badge variant="secondary" className="text-xs">
                      Enrolled
                    </Badge>
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
            <h3 className="text-base font-semibold mb-2">No courses enrolled</h3>
            <p className="text-sm text-muted-foreground mb-6 max-w-sm mx-auto">
              Get started by joining a course to access assignments, materials, and track your progress.
            </p>
            <a
              href="/dashboard/student/courses"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Browse Courses
            </a>
          </div>
        )}
      </motion.div>
    </div>
  );
}

