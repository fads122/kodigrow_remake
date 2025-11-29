'use client';

import { useState } from 'react';
import { supabase } from '../../../../lib/supabase';
import { X, BookOpen, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface JoinCourseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCourseJoined: () => void;
}

export function JoinCourseModal({ isOpen, onClose, onCourseJoined }: JoinCourseModalProps) {
  const [classCode, setClassCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in to join a course');
      }

      // Use RPC function to enroll by class code (bypasses RLS)
      const { data, error: rpcError } = await supabase
        .rpc('enroll_by_class_code', {
          p_class_code: classCode.toUpperCase().trim(),
        });

      if (rpcError) {
        throw new Error(rpcError.message || 'Failed to join course. Please try again.');
      }

      if (!data || (Array.isArray(data) && data.length === 0)) {
        throw new Error('Failed to join course. Please try again.');
      }

      const result = Array.isArray(data) ? data[0] : data;

      if (!result.success) {
        throw new Error(result.message || 'Failed to join course. Please try again.');
      }

      setSuccess(true);
      setTimeout(() => {
        onCourseJoined();
        setClassCode('');
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to join course. Please try again.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-xl"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="mb-6">
            <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
              <BookOpen className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">Join a Course</h2>
            <p className="text-sm text-muted-foreground text-center">
              Enter the class code provided by your professor
            </p>
          </div>

          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="mb-4 flex items-center justify-center w-16 h-16 rounded-full bg-green-500/10 mx-auto">
                <svg
                  className="h-8 w-8 text-green-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold mb-2">Successfully joined!</h3>
              <p className="text-sm text-muted-foreground">Redirecting...</p>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label htmlFor="classCode" className="block text-sm font-medium mb-2">
                  Class Code
                </label>
                <input
                  id="classCode"
                  type="text"
                  value={classCode}
                  onChange={(e) => {
                    setClassCode(e.target.value.toUpperCase().trim());
                    setError(null);
                  }}
                  placeholder="Enter class code (e.g., ABC123)"
                  className="w-full px-4 py-3 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 text-center text-lg font-mono tracking-wider"
                  autoFocus
                  disabled={loading}
                  maxLength={10}
                />
                <p className="text-xs text-muted-foreground mt-2 text-center">
                  Ask your professor for the class code
                </p>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-lg bg-destructive/10 border border-destructive/20 p-3"
                >
                  <p className="text-sm text-destructive">{error}</p>
                </motion.div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading || !classCode.trim()}
                  className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Joining...
                    </>
                  ) : (
                    'Join Course'
                  )}
                </button>
              </div>
            </form>
          )}
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

