'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '../../../../lib/supabase';
import { Brain, Plus, Search, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';
import { CreateFlashcardModal } from './CreateFlashcardModal';
import { StudyMode } from './StudyMode';

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
  last_reviewed: string | null;
  review_count: number;
  mastery_level: number;
  created_at: string;
  updated_at: string;
  course?: Course;
}

export default function FlashcardsPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [flashcards, setFlashcards] = useState<Flashcard[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCourse, setSelectedCourse] = useState<string>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingFlashcard, setEditingFlashcard] = useState<Flashcard | null>(null);
  const [studyModeFlashcards, setStudyModeFlashcards] = useState<Flashcard[] | null>(null);

  const fetchCourses = async () => {
    try {
      const { data: coursesData, error: coursesError } = await supabase
        .rpc('get_student_courses');

      if (coursesError) {
        console.error('Error fetching courses:', coursesError);
        setCourses([]);
        return;
      }

      setCourses(coursesData || []);
    } catch (error) {
      console.error('Error fetching courses:', error);
      setCourses([]);
    }
  };

  const fetchFlashcards = async (studentId: string) => {
    try {
      const { data: flashcardsData, error: flashcardsError } = await supabase
        .from('flashcards')
        .select(`
          *,
          course:courses(id, name, subject, color)
        `)
        .eq('student_id', studentId)
        .order('created_at', { ascending: false });

      if (flashcardsError) {
        console.error('Error fetching flashcards:', flashcardsError);
        setFlashcards([]);
        return;
      }

      // Transform the data to include course info
      interface FlashcardWithCourse {
        id: string;
        student_id: string;
        title?: string | null;
        front: string;
        back: string;
        course_id: string | null;
        difficulty: 'easy' | 'medium' | 'hard';
        last_reviewed: string | null;
        review_count: number;
        mastery_level: number;
        created_at: string;
        updated_at: string;
        course?: Course | null;
      }

      const transformedFlashcards: Flashcard[] = (flashcardsData || []).map((card: FlashcardWithCourse) => ({
        id: card.id,
        student_id: card.student_id,
        title: card.title || card.front || 'Untitled Flashcard',
        front: card.front,
        back: card.back,
        course_id: card.course_id,
        difficulty: card.difficulty,
        last_reviewed: card.last_reviewed,
        review_count: card.review_count,
        mastery_level: card.mastery_level,
        created_at: card.created_at,
        updated_at: card.updated_at,
        course: card.course || undefined,
      }));

      setFlashcards(transformedFlashcards);
    } catch (error) {
      console.error('Error fetching flashcards:', error);
      setFlashcards([]);
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
      await Promise.all([
        fetchCourses(),
        fetchFlashcards(user.id)
      ]);
      setLoading(false);
    };

    getUser();
  }, [router]);


  const handleFlashcardSaved = async () => {
    if (user) {
      await fetchFlashcards(user.id);
    }
    setEditingFlashcard(null);
  };

  // Group flashcards by title (same title = same study set)
  const groupFlashcardsByTitle = (cards: Flashcard[]) => {
    const groups: { [key: string]: Flashcard[] } = {};

    cards.forEach(card => {
      // Use title as the key for grouping
      const title = card.title || 'Untitled';
      const key = title;

      if (!groups[key]) {
        groups[key] = [];
      }
      groups[key].push(card);
    });

    return groups;
  };

  const filteredFlashcards = flashcards.filter(card => {
    const matchesSearch =
      (card.title?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (card.front?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
      (card.back?.toLowerCase() || '').includes(searchQuery.toLowerCase());

    const matchesCourse = selectedCourse === 'all' || card.course_id === selectedCourse;

    return matchesSearch && matchesCourse;
  });

  const flashcardGroups = groupFlashcardsByTitle(filteredFlashcards);
  const groupEntries = Object.entries(flashcardGroups).sort((a, b) => {
    // Sort by most recent created_at in each group
    const aLatest = Math.max(...a[1].map(c => new Date(c.created_at).getTime()));
    const bLatest = Math.max(...b[1].map(c => new Date(c.created_at).getTime()));
    return bLatest - aLatest;
  });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Flashcards</h1>
          <p className="text-muted-foreground mt-1">Create and review your study cards</p>
        </div>
        <div className="flex items-center gap-3">
          {filteredFlashcards.length > 0 && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setStudyModeFlashcards(filteredFlashcards)}
              className="flex items-center gap-2 rounded-lg border border-border bg-background px-4 py-2 text-sm font-medium hover:bg-muted transition-colors"
            >
              <BookOpen className="h-4 w-4" />
              Study All ({filteredFlashcards.length})
            </motion.button>
          )}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => {
              setEditingFlashcard(null);
              setIsCreateModalOpen(true);
            }}
            className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            <Plus className="h-4 w-4" />
            Create Flashcard
          </motion.button>
        </div>
      </div>

      {/* Search and Filter Bar */}
      <div className="flex gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search flashcards..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-lg border border-border bg-card/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
        <select
          value={selectedCourse}
          onChange={(e) => setSelectedCourse(e.target.value)}
          className="px-4 py-2 rounded-lg border border-border bg-card/50 focus:outline-none focus:ring-2 focus:ring-primary/50"
        >
          <option value="all">All Courses</option>
          {courses.map(course => (
            <option key={course.id} value={course.id}>
              {course.name}
            </option>
          ))}
        </select>
      </div>

      {/* Flashcard Groups */}
      {groupEntries.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <h2 className="text-xl font-bold">Flashcard Sets</h2>
            <span className="text-sm text-muted-foreground">
              ({groupEntries.length} {groupEntries.length === 1 ? 'set' : 'sets'})
            </span>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {groupEntries.map(([title, cards], index) => (
              <motion.div
                key={title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                className="p-6 rounded-xl border border-border bg-card hover:shadow-lg transition-all"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-foreground mb-2 line-clamp-2">
                      {title}
                    </h3>
                    <p className="text-sm text-muted-foreground">
                      {cards.length} {cards.length === 1 ? 'flashcard' : 'flashcards'}
                    </p>
                  </div>
                  {cards[0]?.course && (
                    <div
                      className="w-10 h-10 rounded-lg flex-shrink-0 ml-3"
                      style={{ backgroundColor: cards[0].course.color }}
                      title={cards[0].course.name}
                    />
                  )}
                </div>

                {/* Preview of first few flashcards */}
                <div className="space-y-2 mb-4">
                  {cards.slice(0, 3).map((card, idx) => (
                    <div key={card.id} className="text-sm text-muted-foreground truncate">
                      <span className="font-medium">Q{idx + 1}:</span> {card.front}
                    </div>
                  ))}
                  {cards.length > 3 && (
                    <div className="text-xs text-muted-foreground">
                      +{cards.length - 3} more
                    </div>
                  )}
                </div>

                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    setStudyModeFlashcards(cards);
                  }}
                  className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors flex items-center justify-center gap-2 font-medium"
                >
                  <BookOpen className="h-4 w-4" />
                  Study This Set
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-border/50 bg-card/50 p-12 backdrop-blur-sm text-center">
          <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No flashcards found</h3>
          <p className="text-muted-foreground mb-4">
            {searchQuery || selectedCourse !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Create your first flashcard to get started'}
          </p>
          {!searchQuery && selectedCourse === 'all' && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => setIsCreateModalOpen(true)}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <Plus className="h-4 w-4" />
              Create Flashcard
            </motion.button>
          )}
        </div>
      )}

      <CreateFlashcardModal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setEditingFlashcard(null);
        }}
        onFlashcardSaved={handleFlashcardSaved}
        flashcard={editingFlashcard}
        courses={courses}
      />

      {/* Study Mode */}
      {studyModeFlashcards && (
        <StudyMode
          flashcards={studyModeFlashcards}
          onClose={() => setStudyModeFlashcards(null)}
        />
      )}
    </div>
  );
}

