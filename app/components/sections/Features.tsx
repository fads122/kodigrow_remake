'use client';

import { motion, type Variants } from 'framer-motion';
import {
  BookOpen,
  Video,
  FileText,
  Users,
  BarChart3,
  Shield,
  Zap,
  Globe,
  MessageSquare,
  Award,
  Calendar,
  Target,
} from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: BookOpen,
      title: 'Comprehensive Course Library',
      description: 'Access thousands of courses across multiple disciplines with interactive content and multimedia resources.',
      color: 'from-blue-500 to-blue-600',
    },
    {
      icon: Video,
      title: 'Live & Recorded Sessions',
      description: 'Attend live classes or watch recorded sessions at your own pace with HD video quality.',
      color: 'from-purple-500 to-purple-600',
    },
    {
      icon: FileText,
      title: 'Interactive Assignments',
      description: 'Engage with hands-on projects, quizzes, and assessments that enhance your learning experience.',
      color: 'from-pink-500 to-pink-600',
    },
    {
      icon: Users,
      title: 'Collaborative Learning',
      description: 'Join study groups, participate in discussions, and collaborate with peers from around the world.',
      color: 'from-indigo-500 to-indigo-600',
    },
    {
      icon: BarChart3,
      title: 'Progress Tracking',
      description: 'Monitor your learning journey with detailed analytics and personalized progress reports.',
      color: 'from-green-500 to-green-600',
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security and privacy controls.',
      color: 'from-red-500 to-red-600',
    },
    {
      icon: Zap,
      title: 'Lightning Fast',
      description: 'Experience blazing-fast performance with optimized content delivery and caching.',
      color: 'from-yellow-500 to-yellow-600',
    },
    {
      icon: Globe,
      title: 'Multi-Language Support',
      description: 'Learn in your preferred language with support for 50+ languages and translations.',
      color: 'from-cyan-500 to-cyan-600',
    },
    {
      icon: MessageSquare,
      title: '24/7 Support',
      description: 'Get help whenever you need it with our round-the-clock customer support team.',
      color: 'from-orange-500 to-orange-600',
    },
    {
      icon: Award,
      title: 'Certifications',
      description: 'Earn recognized certificates upon course completion to boost your career prospects.',
      color: 'from-teal-500 to-teal-600',
    },
    {
      icon: Calendar,
      title: 'Flexible Scheduling',
      description: 'Learn on your own time with flexible schedules that fit your lifestyle.',
      color: 'from-violet-500 to-violet-600',
    },
    {
      icon: Target,
      title: 'Personalized Learning',
      description: 'AI-powered recommendations help you discover courses tailored to your goals and interests.',
      color: 'from-rose-500 to-rose-600',
    },
  ];

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 50, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
  };

  return (
    <section
      id="features"
      className="relative py-16 sm:py-24 md:py-32 bg-slate-950 text-white overflow-hidden"
    >
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff08_1px,transparent_1px),linear-gradient(to_bottom,#ffffff08_1px,transparent_1px)] bg-[size:24px_24px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-blue-950/20 to-purple-950/20" />

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12 sm:mb-16 md:mb-20"
        >
          <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 sm:mb-6 text-white px-2">
            Everything you need to{' '}
            <span className="bg-gradient-to-r from-sky-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              launch smarter
            </span>
          </h2>
          <p className="text-base sm:text-lg md:text-xl text-slate-300 max-w-3xl mx-auto leading-relaxed px-4">
            Powerful features designed to enhance your learning experience and help you achieve your goals.
          </p>
        </motion.div>

        {/* Features Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: '-100px' }}
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5 md:gap-6"
        >
          {features.map((feature, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              whileHover={{ y: -8 }}
              className="group relative"
            >
              <div className="h-full p-6 sm:p-7 md:p-8 rounded-xl sm:rounded-2xl bg-slate-900/60 backdrop-blur-xl border border-slate-800/50 hover:border-sky-500/50 transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-sky-500/20">
                {/* Icon */}
                <div className="mb-4 sm:mb-5 md:mb-6">
                  <div className={`inline-flex p-3 sm:p-3.5 md:p-4 rounded-lg sm:rounded-xl bg-gradient-to-br ${feature.color} shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-5 h-5 sm:w-5.5 sm:h-5.5 md:w-6 md:h-6 text-white" />
                  </div>
                </div>
                
                {/* Content */}
                <h3 className="text-lg sm:text-xl font-bold mb-2 sm:mb-3 text-white group-hover:text-sky-400 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
                  {feature.description}
                </p>
              </div>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};

export default Features;

