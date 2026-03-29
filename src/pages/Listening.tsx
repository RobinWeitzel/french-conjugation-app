import { useState, useEffect, useCallback, useRef } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { Flashcard, useFlipState } from '../components/Flashcard';
import { SwipeContainer, type SwipeContainerHandle } from '../components/SwipeContainer';
import { StatsBar } from '../components/StatsBar';
import { useMastery } from '../hooks/useMastery';
import { useListeningSettings } from '../hooks/useSettings';
import { useSentences, useAudioCategories } from '../hooks/useDatabase';
import { useAudio } from '../hooks/useAudio';
import type { ListeningCard } from '../lib/types';
import { db } from '../lib/db';

export function Listening() {
  const { categories, speed, setSpeed } = useListeningSettings();
  const sentences = useSentences(categories);
  const audioCategories = useAudioCategories();
  const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession } = useMastery();
  const { flipped, flip, reset: resetFlip } = useFlipState();
  const swipeRef = useRef<SwipeContainerHandle>(null);
  const { playAudio, stop, playing } = useAudio(speed);

  const [cards, setCards] = useState<ListeningCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!sentences) return;

    const buildCards = async () => {
      const allCards: ListeningCard[] = [];

      for (const sentence of sentences) {
        const statId = `listening_${sentence.id}`;
        const stat = await db.stats.get(statId);
        const today = new Date().toISOString().split('T')[0]!;
        if (stat && stat.nextReview > today) continue;

        allCards.push({
          id: sentence.id,
          category: sentence.category,
          french: sentence.french,
          english: sentence.english,
          statId,
        });
      }

      // Shuffle
      for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [allCards[i]!, allCards[j]!] = [allCards[j]!, allCards[i]!];
      }

      setCards(allCards);
      setCurrentIndex(0);
      setLoading(false);
    };

    buildCards();
  }, [sentences]);

  const currentCard = cards[currentIndex];
  const allDone = !loading && cards.length === 0;

  const hasAudioFile = useCallback(
    (card: ListeningCard) => audioCategories?.includes(card.category) ?? false,
    [audioCategories]
  );

  const playCurrentCard = useCallback(() => {
    if (!currentCard) return;
    const audioFile = hasAudioFile(currentCard) ? `./audio/${currentCard.id}.mp3` : undefined;
    playAudio(currentCard.french, audioFile);
  }, [currentCard, hasAudioFile, playAudio]);

  // Auto-play on card load
  useEffect(() => {
    if (currentCard && !flipped) {
      const timeout = setTimeout(playCurrentCard, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, currentCard, flipped, playCurrentCard]);

  const nextCard = useCallback(() => {
    stop();
    resetFlip();
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCards((prev) => prev.filter((_, i) => i > currentIndex));
      setCurrentIndex(0);
    }
  }, [currentIndex, cards.length, resetFlip, stop]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;
    const removedFromSession = await recordCorrect(currentCard.statId);
    if (removedFromSession) {
      setCards((prev) => prev.filter((c) => c.statId !== currentCard.statId));
      stop();
      resetFlip();
    } else {
      nextCard();
    }
  }, [currentCard, recordCorrect, nextCard, resetFlip, stop]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentCard) return;
    await recordIncorrect(currentCard.statId);
    nextCard();
  }, [currentCard, recordIncorrect, nextCard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ') {
        e.preventDefault();
        if (!flipped) playCurrentCard();
        else flip();
      } else if (e.key === 'ArrowRight' && flipped) {
        swipeRef.current?.swipe('right');
      } else if (e.key === 'ArrowLeft' && flipped) {
        swipeRef.current?.swipe('left');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, flipped, playCurrentCard]);

  const handleReset = async () => {
    await resetStats('listening_');
    resetSession();
    window.location.reload();
  };

  const toggleSpeed = () => setSpeed(speed === 1 ? 0.75 : 1);

  const totalCards = sentences?.length ?? 0;

  if (loading) {
    return (
      <PageLayout>
        <Navigation title="Listening" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  if (allDone) {
    return (
      <PageLayout>
        <Navigation title="Listening" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-4xl">&#127881;</p>
            <h2 className="mt-4 text-xl font-semibold">All mastered!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You've mastered all listening cards.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-xl bg-indigo-500 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600"
          >
            Reset & Practice Again
          </button>
        </div>
        <StatsBar stats={sessionStats} remaining={0} total={totalCards} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Navigation
        title="Listening"
        rightElement={
          <span className="text-sm text-slate-500 dark:text-slate-400">
            {cards.length} left
          </span>
        }
      />

      <div className="flex flex-1 flex-col justify-center gap-6 py-4">
        {currentCard && (
          <SwipeContainer
            ref={swipeRef}
            enabled={flipped}
            onSwipeRight={handleSwipeRight}
            onSwipeLeft={handleSwipeLeft}
            cardKey={currentCard.statId}
          >
            <Flashcard
              flipped={flipped}
              onFlip={flip}
              front={
                <div className="flex flex-col items-center gap-4">
                  <p className="text-xs font-medium text-slate-400 dark:text-slate-500">
                    {currentCard.category}
                  </p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (playing) stop();
                      else playCurrentCard();
                    }}
                    className="flex size-20 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
                  >
                    {playing ? (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8">
                        <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
                      </svg>
                    ) : (
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-8">
                        <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleSpeed();
                    }}
                    className="rounded-lg px-3 py-1 text-xs font-medium text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    {speed}x
                  </button>
                  <p className="text-xs text-slate-400 dark:text-slate-500">Tap card to reveal</p>
                </div>
              }
              back={
                <div className="flex flex-col items-center gap-4 text-center">
                  <p className="text-lg font-semibold">{currentCard.french}</p>
                  <div className="h-px w-16 bg-slate-200 dark:bg-slate-600" />
                  <p className="text-sm text-slate-500 dark:text-slate-400">{currentCard.english}</p>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      playCurrentCard();
                    }}
                    className="flex size-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 transition-colors hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-4">
                      <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
                    </svg>
                  </button>
                  <p className="text-xs text-slate-400 dark:text-slate-500">
                    Swipe right if correct, left if not
                  </p>
                </div>
              }
            />
          </SwipeContainer>
        )}

        <StatsBar stats={sessionStats} remaining={cards.length} total={totalCards} />
      </div>
    </PageLayout>
  );
}
