'use client';

import { useState } from 'react';
import { X, RotateCcw, ChevronLeft, ChevronRight, CheckCircle2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface Flashcard {
  id: string;
  title: string;
  front: string;
  back: string;
  course?: {
    id: string;
    name: string;
    color: string;
  } | null;
}

interface StudyModeProps {
  flashcards: Flashcard[];
  onClose: () => void;
}

export function StudyMode({ flashcards, onClose }: StudyModeProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [completedCards, setCompletedCards] = useState<Set<string>>(new Set());

  const currentCard = flashcards[currentIndex];
  const progress = ((currentIndex + 1) / flashcards.length) * 100;
  const isLastCard = currentIndex === flashcards.length - 1;
  const isFirstCard = currentIndex === 0;

  const handleNext = () => {
    if (!isLastCard) {
      setCompletedCards(prev => new Set(prev).add(currentCard.id));
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    }
  };

  const handlePrevious = () => {
    if (!isFirstCard) {
      setCurrentIndex(prev => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleComplete = () => {
    setCompletedCards(prev => new Set(prev).add(currentCard.id));
    if (!isLastCard) {
      setCurrentIndex(prev => prev + 1);
      setIsFlipped(false);
    } else {
      // All cards completed
      onClose();
    }
  };

  if (flashcards.length === 0) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-6 border-b border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div>
              <h2 className="text-xl font-bold">Study Mode</h2>
              <p className="text-sm text-muted-foreground">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
            </div>
          </div>
          
          {/* Progress Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-primary"
                initial={{ width: 0 }}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>
          </div>

          {currentCard.course && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-muted/50">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: currentCard.course.color }}
              />
              <span className="text-sm font-medium">{currentCard.course.name}</span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex items-center justify-center pt-24 pb-32">
        <div className="w-full max-w-3xl px-6">
          <div className="relative h-[400px] perspective-1000">
            <motion.div
              className="relative w-full h-full preserve-3d cursor-pointer"
              animate={{ rotateY: isFlipped ? 180 : 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
              onClick={handleFlip}
            >
              {/* Front of card */}
              <div
                className="absolute inset-0 w-full h-full rounded-2xl border-2 border-border bg-card shadow-2xl backface-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(0deg)',
                }}
              >
                <div className="p-8 h-full flex flex-col items-center justify-center">
                  <div className="mb-6 text-center">
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      {currentCard.title}
                    </h3>
                  </div>
                  
                  <div className="text-center mb-4">
                    <p className="text-sm text-muted-foreground mb-2">Question</p>
                    <h3 className="text-2xl font-bold text-foreground">
                      {currentCard.front}
                    </h3>
                  </div>

                  <div className="mt-auto pt-6">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Click to reveal answer
                    </p>
                  </div>
                </div>
              </div>

              {/* Back of card */}
              <div
                className="absolute inset-0 w-full h-full rounded-2xl border-2 border-primary/50 bg-gradient-to-br from-primary/10 to-primary/5 shadow-2xl backface-hidden"
                style={{
                  backfaceVisibility: 'hidden',
                  transform: 'rotateY(180deg)',
                }}
              >
                <div className="p-8 h-full flex flex-col items-center justify-center">
                  <div className="mb-6 text-center">
                    <h3 className="text-lg font-semibold text-primary mb-2">
                      {currentCard.title}
                    </h3>
                  </div>

                  <div className="mb-6">
                    <span className="text-xs px-3 py-1 rounded-full font-medium bg-primary/20 text-primary">
                      Answer
                    </span>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h3 className="text-2xl font-bold text-foreground">
                      {currentCard.back}
                    </h3>
                  </div>

                  <div className="mt-auto pt-6">
                    <p className="text-sm text-muted-foreground flex items-center gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Click to see question again
                    </p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="absolute bottom-0 left-0 right-0 p-6 border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <button
            onClick={handlePrevious}
            disabled={isFirstCard}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-border bg-background hover:bg-muted transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </button>

          <div className="flex items-center gap-2">
            {flashcards.map((card, index) => (
              <div
                key={card.id}
                className={`w-2 h-2 rounded-full transition-colors ${
                  index === currentIndex
                    ? 'bg-primary w-8'
                    : completedCards.has(card.id)
                    ? 'bg-green-500'
                    : 'bg-muted'
                }`}
              />
            ))}
          </div>

          {isLastCard ? (
            <button
              onClick={handleComplete}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              <CheckCircle2 className="h-4 w-4" />
              Complete Study
            </button>
          ) : (
            <button
              onClick={handleNext}
              disabled={!isFlipped}
              className="flex items-center gap-2 px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

