'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { BookOpen, FileText, TrendingUp, Clock, Award, Calendar, MessageSquare, CheckCircle2, Target } from 'lucide-react';
import { motion } from 'framer-motion';
import FloatingLines from '../../components/ui/FloatingLines';

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
      subtitle: enrolledCoursesCount === 0 ? 'No courses yet' : `${enrolledCoursesCount} ${enrolledCoursesCount === 1 ? 'course' : 'courses'}`,
      icon: BookOpen,
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'Active Assignments',
      value: assignmentsCount.toString(),
      subtitle: assignmentsCount === 0 ? 'All caught up!' : `${assignmentsCount} ${assignmentsCount === 1 ? 'assignment' : 'assignments'}`,
      icon: FileText,
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Average Grade',
      value: averageGrade !== null ? `${averageGrade.toFixed(1)}%` : 'N/A',
      subtitle: averageGrade !== null ? 'Keep it up!' : 'No grades yet',
      icon: TrendingUp,
      gradient: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/30',
    },
    {
      title: 'Completion Rate',
      value: enrolledCoursesCount > 0 ? '0%' : '0%',
      subtitle: 'Track your progress',
      icon: Target,
      gradient: 'from-orange-500/20 to-red-500/20',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
    },
  ];

  const quickActions = [
    { icon: BookOpen, label: 'Join Course', color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400', href: '/dashboard/student/courses' },
    { icon: FileText, label: 'View Assignments', color: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400', href: '/dashboard/student/assignments' },
    { icon: Calendar, label: 'My Schedule', color: 'bg-green-500/10 hover:bg-green-500/20 text-green-400', href: '/dashboard/student/schedule' },
    { icon: Target, label: 'View Progress', color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400', href: '#' },
  ];

  const recentActivity = [
    { icon: MessageSquare, text: 'No recent activity', time: 'Just now' },
  ];

  return (
    <div className="relative space-y-6">
      {/* FloatingLines background */}
      <div className="absolute inset-0 -z-10 w-full h-full opacity-30">
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={3}
          lineDistance={8}
          bendRadius={5}
          bendStrength={-0.5}
          interactive={false}
          parallax={false}
        />
      </div>

      {/* Welcome Section */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-gradient-to-br from-card via-card to-card/50 p-8 shadow-lg backdrop-blur-sm"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-transparent" />
        <div className="relative">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
            Welcome back, Student! 👋
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {user?.email || 'Loading...'}
          </p>
          <div className="mt-4 flex gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Award className="mr-1.5 h-3.5 w-3.5" />
              Student
            </span>
            <span className="inline-flex items-center rounded-full bg-muted px-3 py-1 text-sm text-muted-foreground">
              <Clock className="mr-1.5 h-3.5 w-3.5" />
              Active
            </span>
          </div>
        </div>
      </motion.div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className={`group relative overflow-hidden rounded-xl border ${stat.borderColor} bg-card/50 p-6 backdrop-blur-sm transition-all hover:shadow-lg hover:scale-[1.02]`}
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-0 transition-opacity group-hover:opacity-100`} />
              <div className="relative">
                <div className="mb-4 flex items-center justify-between">
                  <div className={`rounded-lg p-2 ${stat.iconColor === 'text-blue-400' ? 'bg-blue-500/10' : stat.iconColor === 'text-purple-400' ? 'bg-purple-500/10' : stat.iconColor === 'text-green-400' ? 'bg-green-500/10' : 'bg-orange-500/10'}`}>
                    <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                  </div>
                </div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">{stat.title}</h3>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-xs text-muted-foreground">{stat.subtitle}</p>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="lg:col-span-2 rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
        >
          <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => {
              const Icon = action.icon;
              return (
                <motion.a
                  key={action.label}
                  href={action.href}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 rounded-lg border border-border/50 p-4 transition-all cursor-pointer ${action.color}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{action.label}</span>
                </motion.a>
              );
            })}
          </div>
        </motion.div>

        {/* Recent Activity */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
        >
          <h2 className="text-xl font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-4">
            {recentActivity.map((activity, index) => {
              const Icon = activity.icon;
              return (
                <div key={index} className="flex items-start gap-3">
                  <div className="rounded-lg bg-muted p-2">
                    <Icon className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{activity.text}</p>
                    <p className="text-xs text-muted-foreground mt-1">{activity.time}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>
      </div>

      {/* My Courses Section */}
      {courses.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl border border-border/50 bg-card/50 p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">My Courses</h2>
            <a
              href="/dashboard/student/courses"
              className="text-sm text-primary hover:underline"
            >
              View all
            </a>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            {courses.map((course, index) => (
              <motion.a
                key={course.id}
                href={`/dashboard/student/courses/${course.id}`}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: 0.7 + index * 0.1 }}
                whileHover={{ scale: 1.02 }}
                className="group relative overflow-hidden rounded-lg border border-border/50 bg-card/80 p-4 transition-all hover:shadow-lg"
              >
                <div
                  className="absolute top-0 left-0 right-0 h-1"
                  style={{ backgroundColor: course.color }}
                />
                <div className="mt-2">
                  <h3 className="font-semibold text-sm mb-1 line-clamp-1">{course.name}</h3>
                  <p className="text-xs text-muted-foreground mb-2">{course.subject}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <BookOpen className="h-3 w-3" />
                    <span>Enrolled</span>
                  </div>
                </div>
              </motion.a>
            ))}
          </div>
        </motion.div>
      )}

      {/* Empty State for Courses */}
      {courses.length === 0 && enrolledCoursesCount === 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.6 }}
          className="rounded-xl border border-border/50 bg-card/50 p-12 backdrop-blur-sm text-center"
        >
          <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No courses yet</h3>
          <p className="text-muted-foreground mb-4">Join a course to get started with your learning journey!</p>
          <a
            href="/dashboard/student/courses"
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <BookOpen className="h-4 w-4" />
            Browse Courses
          </a>
        </motion.div>
      )}
    </div>
  );
}

