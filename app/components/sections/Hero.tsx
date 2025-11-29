'use client';

import { motion, type Variants } from 'framer-motion';
import { ArrowRight, Play, BookOpen, Users, Award } from 'lucide-react';
import Button from '../ui/Button';
import FloatingLines from '../ui/FloatingLines';

interface HeroProps {
  onGetStarted?: () => void;
}

const Hero = ({ onGetStarted }: HeroProps) => {
  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.3,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        duration: 0.5,
        ease: 'easeOut' as const,
      },
    },
  };

  const floatingVariants: Variants = {
    animate: {
      y: [0, -20, 0],
      transition: {
        duration: 3,
        repeat: Infinity,
        ease: 'easeInOut' as const,
      },
    },
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden text-white">
      {/* FloatingLines animated background */}
      <div className="absolute inset-0 -z-10 w-full h-full">
        <FloatingLines
          enabledWaves={['top', 'middle', 'bottom']}
          lineCount={5}
          lineDistance={5}
          bendRadius={5}
          bendStrength={-0.5}
          interactive={true}
          parallax={true}
        />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center"
        >
          <motion.div variants={itemVariants} className="mb-6">
            {/* <motion.span
              className="inline-block px-4 py-2 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm font-medium mb-6"
              whileHover={{ scale: 1.05 }}
            >
              🎓 Transform Your Learning Experience
            </motion.span> */}
          </motion.div>

          <motion.h1
            variants={itemVariants}
            className="text-5xl md:text-6xl lg:text-7xl font-extrabold mb-6 leading-tight"
          >
            <span className="block bg-gradient-to-r from-sky-400 via-indigo-400 to-fuchsia-400 bg-clip-text text-transparent">
              Learn. Grow. Excel.
            </span>
            <span className="mt-2 block text-slate-100">
              The LMS built for the next generation.
            </span>
          </motion.h1>

          <motion.p
            variants={itemVariants}
            className="text-lg md:text-xl text-slate-300 mb-10 max-w-3xl mx-auto leading-relaxed"
          >
            The most comprehensive learning management system designed to empower students,
            educators, and institutions with cutting-edge tools and seamless experiences.
          </motion.p>

          <motion.div
            variants={itemVariants}
            className="flex flex-col lg:flex-row gap-10 items-center justify-between mb-16"
          >
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button size="lg" className="group shadow-[0_0_40px_rgba(56,189,248,0.35)]" onClick={onGetStarted}>
                Get Started Free
                <ArrowRight className="ml-2 inline-block group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button variant="outline" size="lg" className="group border-slate-600/70 bg-slate-900/40 hover:bg-slate-900/80">
                <Play className="mr-2 inline-block" />
                Watch Demo
              </Button>
            </div>

            {/* mini pill */}
            <div className="rounded-2xl border border-slate-700 bg-slate-900/60 px-5 py-4 backdrop-blur-xl shadow-lg max-w-sm">
              <p className="text-sm text-slate-300">
                <span className="font-semibold text-sky-400">3x faster</span> course completion for teams using KodiGrow.
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={itemVariants}
            className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto"
          >
            {[
              { icon: Users, value: '100K+', label: 'Active Students' },
              { icon: BookOpen, value: '10K+', label: 'Courses' },
              { icon: Award, value: '500+', label: 'Instructors' },
              { icon: Award, value: '98%', label: 'Satisfaction' },
            ].map((stat, index) => (
              <motion.div
                key={index}
                variants={floatingVariants}
                animate="animate"
                style={{ animationDelay: `${index * 0.2}s` }}
                className="relative overflow-hidden rounded-2xl border border-slate-700/60 bg-slate-900/60 px-4 py-4 text-center backdrop-blur-xl shadow-[0_18px_45px_rgba(15,23,42,0.8)]"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 via-transparent to-fuchsia-500/10" />
                <div className="relative">
                  <stat.icon className="w-7 h-7 mx-auto mb-2 text-sky-400" />
                  <div className="text-2xl font-semibold text-slate-50 mb-1">
                    {stat.value}
                  </div>
                  <div className="text-xs text-slate-400 uppercase tracking-wide">
                    {stat.label}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        className="absolute bottom-8 left-1/2 transform -translate-x-1/2"
        animate={{ y: [0, 10, 0] }}
        transition={{ duration: 1.5, repeat: Infinity }}
      >
        <div className="w-6 h-10 border-2 border-gray-400 dark:border-gray-600 rounded-full flex justify-center">
          <motion.div
            className="w-1 h-3 bg-gray-400 dark:bg-gray-600 rounded-full mt-2"
            animate={{ y: [0, 12, 0] }}
            transition={{ duration: 1.5, repeat: Infinity }}
          />
        </div>
      </motion.div>
    </section>
  );
};

export default Hero;

