'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../lib/supabase';
import { BookOpen, Users, FileText, TrendingUp, Clock, Award, Calendar, MessageSquare } from 'lucide-react';
import { motion } from 'framer-motion';

interface User {
  id: string;
  email?: string;
  user_metadata?: {
    account_type?: string;
  };
}

export default function ProfessorDashboardPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [courseCount, setCourseCount] = useState(0);
  const [studentCount, setStudentCount] = useState(0);

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
      // Fetch course count
      const { count: coursesCount, error: coursesError } = await supabase
        .from('courses')
        .select('*', { count: 'exact', head: true })
        .eq('professor_id', professorId);

      if (coursesError) {
        console.error('Error fetching course count:', coursesError);
      } else {
        setCourseCount(coursesCount || 0);
      }

      // Fetch total student count across all courses
      const { data: courses, error: coursesListError } = await supabase
        .from('courses')
        .select('id')
        .eq('professor_id', professorId);

      if (coursesListError) {
        console.error('Error fetching courses for student count:', coursesListError);
      } else if (courses && courses.length > 0) {
        const courseIds = courses.map(c => c.id);
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
      gradient: 'from-blue-500/20 to-cyan-500/20',
      iconColor: 'text-blue-400',
      borderColor: 'border-blue-500/30',
    },
    {
      title: 'Total Students',
      value: studentCount.toString(),
      subtitle: studentCount === 0 ? 'No students enrolled' : `${studentCount} ${studentCount === 1 ? 'student' : 'students'}`,
      icon: Users,
      gradient: 'from-purple-500/20 to-pink-500/20',
      iconColor: 'text-purple-400',
      borderColor: 'border-purple-500/30',
    },
    {
      title: 'Pending Assignments',
      value: '0',
      subtitle: 'All caught up!',
      icon: FileText,
      gradient: 'from-green-500/20 to-emerald-500/20',
      iconColor: 'text-green-400',
      borderColor: 'border-green-500/30',
    },
    {
      title: 'Completion Rate',
      value: '0%',
      subtitle: 'No data available',
      icon: TrendingUp,
      gradient: 'from-orange-500/20 to-red-500/20',
      iconColor: 'text-orange-400',
      borderColor: 'border-orange-500/30',
    },
  ];

  const quickActions = [
    { icon: BookOpen, label: 'Create Course', color: 'bg-blue-500/10 hover:bg-blue-500/20 text-blue-400' },
    { icon: Users, label: 'Add Students', color: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400' },
    { icon: FileText, label: 'New Assignment', color: 'bg-green-500/10 hover:bg-green-500/20 text-green-400' },
    { icon: Calendar, label: 'Schedule Class', color: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400' },
  ];

  const recentActivity = [
    { icon: MessageSquare, text: 'No recent activity', time: 'Just now' },
  ];

  return (
    <div className="space-y-6">
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
            Welcome back, Professor!
          </h1>
          <p className="text-muted-foreground mt-2 text-lg">
            {user?.email || 'Loading...'}
          </p>
          <div className="mt-4 flex gap-2">
            <span className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              <Award className="mr-1.5 h-3.5 w-3.5" />
              Educator
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
              className={`group relative overflow-hidden rounded-xl border ${stat.borderColor} bg-card/50 p-6 backdrop-blur-sm transition-all hover:shadow-lg`}
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
                <motion.button
                  key={action.label}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`flex items-center gap-3 rounded-lg border border-border/50 p-4 transition-all ${action.color}`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{action.label}</span>
                </motion.button>
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
    </div>
  );
}

