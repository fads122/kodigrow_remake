'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../../../../lib/supabase';
import { X, Brain, Loader2, Plus, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Course {
  id: string;
  name: string;
  subject: string;
  color: string;
}

interface Flashcard {
  id: string;
  student_id: string;
  title: string;
  front: string;
  back: string;
  course_id: string | null;
  difficulty: 'easy' | 'medium' | 'hard';
}

interface FlashcardEntry {
  front: string;
  back: string;
}

interface CreateFlashcardModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFlashcardSaved: () => void;
  flashcard?: Flashcard | null;
  courses: Course[];
}

export function CreateFlashcardModal({
  isOpen,
  onClose,
  onFlashcardSaved,
  flashcard,
  courses,
}: CreateFlashcardModalProps) {
  // For editing single flashcard
  const [title, setTitle] = useState('');
  const [front, setFront] = useState('');
  const [back, setBack] = useState('');
  const [courseId, setCourseId] = useState<string>('');
  
  // For creating multiple flashcards
  const [flashcardEntries, setFlashcardEntries] = useState<FlashcardEntry[]>([
    { front: '', back: '' }
  ]);
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (flashcard) {
      setTitle(flashcard.title);
      setFront(flashcard.front);
      setBack(flashcard.back);
      setCourseId(flashcard.course_id || '');
      setFlashcardEntries([{ front: flashcard.front, back: flashcard.back }]);
    } else {
      setTitle('');
      setFront('');
      setBack('');
      setCourseId('');
      setFlashcardEntries([{ front: '', back: '' }]);
    }
    setError(null);
  }, [flashcard, isOpen]);

  const addFlashcardEntry = () => {
    setFlashcardEntries([...flashcardEntries, { front: '', back: '' }]);
  };

  const removeFlashcardEntry = (index: number) => {
    if (flashcardEntries.length > 1) {
      setFlashcardEntries(flashcardEntries.filter((_, i) => i !== index));
    }
  };

  const updateFlashcardEntry = (index: number, field: keyof FlashcardEntry, value: string) => {
    const updated = [...flashcardEntries];
    updated[index] = { ...updated[index], [field]: value };
    setFlashcardEntries(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const { data: { user }, error: userError } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error('You must be logged in to create a flashcard');
      }

      if (flashcard) {
        // Update existing flashcard (single mode)
        if (!title.trim() || !front.trim() || !back.trim()) {
          throw new Error('Title, question, and answer are required');
        }

        const { error: updateError } = await supabase
          .from('flashcards')
          .update({
            title: title.trim(),
            front: front.trim(),
            back: back.trim(),
            course_id: courseId || null,
            updated_at: new Date().toISOString(),
          })
          .eq('id', flashcard.id);

        if (updateError) {
          throw updateError;
        }
      } else {
        // Create multiple flashcards
        if (!title.trim()) {
          throw new Error('Title is required');
        }

        const validEntries = flashcardEntries.filter(entry => entry.front.trim() && entry.back.trim());
        
        if (validEntries.length === 0) {
          throw new Error('At least one flashcard with both question and answer is required');
        }

        // Prepare all flashcards for batch insert
        const flashcardsToInsert = validEntries.map(entry => ({
          student_id: user.id,
          title: title.trim(),
          front: entry.front.trim(),
          back: entry.back.trim(),
          course_id: courseId || null,
        }));

        const { error: insertError } = await supabase
          .from('flashcards')
          .insert(flashcardsToInsert);

        if (insertError) {
          console.error('Insert error:', insertError);
          // Check if it's a column error
          if (insertError.message?.includes('column') || insertError.message?.includes('title')) {
            throw new Error('Database schema needs to be updated. Please run the migration SQL to add the title column.');
          }
          throw insertError;
        }
      }

      onFlashcardSaved();
      onClose();
    } catch (err) {
      console.error('Flashcard save error:', err);
      let errorMessage = 'Failed to save flashcard. Please try again.';
      
      if (err instanceof Error) {
        errorMessage = err.message;
      } else if (err && typeof err === 'object' && 'message' in err) {
        errorMessage = String(err.message);
      }
      
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
          className="relative w-full max-w-2xl max-h-[90vh] rounded-2xl border border-border bg-card shadow-xl flex flex-col"
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 z-10 rounded-lg p-1 text-muted-foreground hover:bg-muted transition-colors"
          >
            <X className="h-4 w-4" />
          </button>

          <div className="p-6 pb-4 flex-shrink-0">
            <div className="mb-4 flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto">
              <Brain className="h-6 w-6 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-center mb-2">
              {flashcard ? 'Edit Flashcard' : 'Create Flashcards'}
            </h2>
            <p className="text-sm text-muted-foreground text-center">
              {flashcard 
                ? 'Update your flashcard' 
                : flashcardEntries.length > 1 
                  ? `Creating ${flashcardEntries.filter(e => e.front.trim() && e.back.trim()).length} flashcards`
                  : 'Add study cards to your collection'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="flex-1 flex flex-col min-h-0 px-6 pb-6">
            <div className="flex-1 overflow-y-auto pr-2 space-y-6">
              {/* Title - Shared for all flashcards */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium mb-2">
                  Title/Topic <span className="text-destructive">*</span>
                </label>
                <input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => {
                    setTitle(e.target.value);
                    setError(null);
                  }}
                  placeholder="Enter flashcard title or topic..."
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  autoFocus
                  disabled={loading}
                  required
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This title will be applied to all flashcards in this set
                </p>
              </div>

              {/* Course Selection - Shared for all flashcards */}
              <div>
                <label htmlFor="course" className="block text-sm font-medium mb-2">
                  Course (Optional) - Applied to all flashcards
                </label>
                <select
                  id="course"
                  value={courseId}
                  onChange={(e) => setCourseId(e.target.value)}
                  className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50"
                  disabled={loading}
                >
                  <option value="">No course</option>
                  {courses.map(course => (
                    <option key={course.id} value={course.id}>
                      {course.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Flashcard Entries */}
              <AnimatePresence>
                {flashcard ? (
                  // Edit mode - single flashcard
                  <div className="space-y-4">
                    {/* Question (Front) */}
                    <div>
                      <label htmlFor="front" className="block text-sm font-medium mb-2">
                        Question <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        id="front"
                        value={front}
                        onChange={(e) => {
                          setFront(e.target.value);
                          setError(null);
                        }}
                        placeholder="Enter the question..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        autoFocus
                        disabled={loading}
                        required
                      />
                    </div>

                    {/* Answer (Back) */}
                    <div>
                      <label htmlFor="back" className="block text-sm font-medium mb-2">
                        Answer <span className="text-destructive">*</span>
                      </label>
                      <textarea
                        id="back"
                        value={back}
                        onChange={(e) => {
                          setBack(e.target.value);
                          setError(null);
                        }}
                        placeholder="Enter the answer..."
                        rows={3}
                        className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                        disabled={loading}
                        required
                      />
                    </div>
                  </div>
                ) : (
                  // Create mode - multiple flashcards
                  flashcardEntries.map((entry, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="p-4 rounded-xl border border-border/50 bg-muted/30 space-y-4"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="text-sm font-semibold text-foreground">
                          Flashcard {index + 1}
                        </h3>
                        {flashcardEntries.length > 1 && (
                          <button
                            type="button"
                            onClick={() => removeFlashcardEntry(index)}
                            disabled={loading}
                            className="p-1.5 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                            title="Remove flashcard"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Question (Front) */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Question <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          value={entry.front}
                          onChange={(e) => {
                            updateFlashcardEntry(index, 'front', e.target.value);
                            setError(null);
                          }}
                          placeholder="Enter the question..."
                          rows={2}
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                          autoFocus={index === 0}
                          disabled={loading}
                        />
                      </div>

                      {/* Answer (Back) */}
                      <div>
                        <label className="block text-sm font-medium mb-2">
                          Answer <span className="text-destructive">*</span>
                        </label>
                        <textarea
                          value={entry.back}
                          onChange={(e) => {
                            updateFlashcardEntry(index, 'back', e.target.value);
                            setError(null);
                          }}
                          placeholder="Enter the answer..."
                          rows={2}
                          className="w-full px-4 py-2 rounded-lg border border-border bg-background focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none"
                          disabled={loading}
                        />
                      </div>
                    </motion.div>
                  ))
                )}
              </AnimatePresence>

              {/* Add Another Button - Only in create mode */}
              {!flashcard && (
                <motion.button
                  type="button"
                  onClick={addFlashcardEntry}
                  disabled={loading}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="w-full py-3 rounded-lg border-2 border-dashed border-border hover:border-primary/50 hover:bg-primary/5 transition-colors flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground disabled:opacity-50"
                >
                  <Plus className="h-4 w-4" />
                  <span className="font-medium">Add Another Flashcard</span>
                </motion.button>
              )}
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

            <div className="flex gap-3 pt-4 border-t border-border flex-shrink-0">
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
                disabled={
                  loading || 
                  (flashcard 
                    ? !title.trim() || !front.trim() || !back.trim()
                    : !title.trim() || flashcardEntries.filter(e => e.front.trim() && e.back.trim()).length === 0
                  )
                }
                className="flex-1 px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {flashcard ? 'Updating...' : 'Creating...'}
                  </>
                ) : (
                  flashcard 
                    ? 'Update' 
                    : `Create ${flashcardEntries.filter(e => e.front.trim() && e.back.trim()).length || ''} Flashcard${flashcardEntries.filter(e => e.front.trim() && e.back.trim()).length !== 1 ? 's' : ''}`
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}

