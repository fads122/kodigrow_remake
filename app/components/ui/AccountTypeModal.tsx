'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, GraduationCap, UserCog } from 'lucide-react';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface AccountTypeModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (type: 'professor' | 'student') => void;
}

const AccountTypeModal = ({ isOpen, onClose, onSelect }: AccountTypeModalProps) => {
  const router = useRouter();

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleSelect = (type: 'professor' | 'student') => {
    onSelect(type);
    onClose();
    router.push(`/signup?type=${type}`);
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
            onClick={onClose}
          />

          {/* Modal */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="relative w-full max-w-2xl pointer-events-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="bg-slate-900 rounded-3xl border border-slate-800/50 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="relative p-8 border-b border-slate-800/50">
                  <button
                    onClick={onClose}
                    className="absolute top-6 right-6 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                  <h2 className="text-3xl font-bold text-white mb-2">
                    Choose Your Account Type
                  </h2>
                  <p className="text-slate-400">
                    Select the account type that best describes your role
                  </p>
                </div>

                {/* Options */}
                <div className="p-8 grid md:grid-cols-2 gap-6">
                  {/* Student Option */}
                  <motion.button
                    onClick={() => handleSelect('student')}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative p-8 rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border-2 border-blue-500/30 hover:border-blue-400/60 transition-all duration-300 text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-600/10 to-purple-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <div className="relative">
                      <div className="mb-6">
                        <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg shadow-blue-500/30 group-hover:scale-110 transition-transform">
                          <GraduationCap className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-blue-300 transition-colors">
                        Student
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        Access courses, track your progress, and collaborate with peers to enhance your learning journey.
                      </p>
                    </div>
                  </motion.button>

                  {/* Professor Option */}
                  <motion.button
                    onClick={() => handleSelect('professor')}
                    whileHover={{ scale: 1.02, y: -4 }}
                    whileTap={{ scale: 0.98 }}
                    className="group relative p-8 rounded-2xl bg-gradient-to-br from-purple-600/20 to-pink-600/20 border-2 border-purple-500/30 hover:border-purple-400/60 transition-all duration-300 text-left"
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-purple-600/10 to-pink-600/10 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl" />
                    <div className="relative">
                      <div className="mb-6">
                        <div className="inline-flex p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg shadow-purple-500/30 group-hover:scale-110 transition-transform">
                          <UserCog className="w-8 h-8 text-white" />
                        </div>
                      </div>
                      <h3 className="text-2xl font-bold text-white mb-3 group-hover:text-purple-300 transition-colors">
                        Professor
                      </h3>
                      <p className="text-slate-300 leading-relaxed">
                        Create and manage courses, engage with students, and track their progress with powerful teaching tools.
                      </p>
                    </div>
                  </motion.button>
                </div>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
};

export default AccountTypeModal;

