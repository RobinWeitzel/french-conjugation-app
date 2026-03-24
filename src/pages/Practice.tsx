import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { Flashcard, useFlipState } from '../components/Flashcard';
import { SwipeContainer, type SwipeContainerHandle } from '../components/SwipeContainer';
import { StatsBar } from '../components/StatsBar';
import { useMastery } from '../hooks/useMastery';
import { usePracticeSettings } from '../hooks/useSettings';
import { useVerbs } from '../hooks/useDatabase';
import { TENSES, PRONOUNS } from '../lib/constants';
import type { PracticeCard } from '../lib/types';
import { db } from '../lib/db';

export function Practice() {
  const verbs = useVerbs();
  const { direction, showInfinitive, tenses } = usePracticeSettings();
  const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession } = useMastery();
  const { flipped, flip, reset: resetFlip } = useFlipState();
  const swipeRef = useRef<SwipeContainerHandle>(null);

  const [cards, setCards] = useState<PracticeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Build card pool
  useEffect(() => {
    if (!verbs) return;

    const buildCards = async () => {
      const allCards: PracticeCard[] = [];

      for (const verb of verbs) {
        for (const tense of tenses) {
          const tenseData = verb.tenses[tense];
          if (!tenseData) continue;

          for (const pronoun of PRONOUNS) {
            const conjugation = tenseData[pronoun];
            if (!conjugation) continue;

            const statId = `${verb.infinitive}_${pronoun}_${tense}`;
            const stat = await db.stats.get(statId);
            if (stat?.mastered) continue;

            allCards.push({
              infinitive: verb.infinitive,
              english: verb.english,
              tense,
              pronoun,
              french: conjugation.french,
              englishConjugation: conjugation.english,
              statId,
            });
          }
        }
      }

      // Shuffle
      for (let i = allCards.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        const temp = allCards[i]!;
        allCards[i] = allCards[j]!;
        allCards[j] = temp;
      }

      setCards(allCards);
      setCurrentIndex(0);
      setLoading(false);
    };

    buildCards();
  }, [verbs, tenses]);

  const currentCard = cards[currentIndex];
  const allDone = !loading && cards.length === 0;

  const nextCard = useCallback(() => {
    resetFlip();
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCards((prev) => prev.filter((_, i) => i > currentIndex));
      setCurrentIndex(0);
    }
  }, [currentIndex, cards.length, resetFlip]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;
    const mastered = await recordCorrect(currentCard.statId);
    if (mastered) {
      setCards((prev) => prev.filter((c) => c.statId !== currentCard.statId));
      resetFlip();
    } else {
      nextCard();
    }
  }, [currentCard, recordCorrect, nextCard, resetFlip]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentCard) return;
    await recordIncorrect(currentCard.statId);
    nextCard();
  }, [currentCard, recordIncorrect, nextCard]);

  // Keyboard shortcuts
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.key === 'Spacebar') {
        e.preventDefault();
        flip();
      } else if (e.key === 'ArrowRight' && flipped) {
        swipeRef.current?.swipe('right');
      } else if (e.key === 'ArrowLeft' && flipped) {
        swipeRef.current?.swipe('left');
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [flip, flipped]);

  const handleReset = async () => {
    await resetStats();
    resetSession();
    setLoading(true);
    window.location.reload();
  };

  const totalCards = useMemo(() => {
    if (!verbs) return 0;
    let count = 0;
    for (const verb of verbs) {
      for (const tense of tenses) {
        const tenseData = verb.tenses[tense];
        if (!tenseData) continue;
        for (const pronoun of PRONOUNS) {
          if (tenseData[pronoun]) count++;
        }
      }
    }
    return count;
  }, [verbs, tenses]);

  if (loading) {
    return (
      <PageLayout>
        <Navigation title="Practice" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  if (allDone) {
    return (
      <PageLayout>
        <Navigation title="Practice" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-center">
            <p className="text-4xl">🎉</p>
            <h2 className="mt-4 text-xl font-semibold">All mastered!</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              You&apos;ve mastered all cards in the selected tenses.
            </p>
          </div>
          <button
            onClick={handleReset}
            className="rounded-xl bg-indigo-500 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600"
          >
            Reset &amp; Practice Again
          </button>
        </div>
        <StatsBar stats={sessionStats} remaining={0} total={totalCards} />
      </PageLayout>
    );
  }

  return (
    <PageLayout>
      <Navigation
        title="Practice"
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
                <div className="text-center">
                  {showInfinitive && (
                    <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
                      {currentCard.infinitive} ({currentCard.english})
                    </p>
                  )}
                  <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
                  <p className="mt-4 text-2xl font-semibold">
                    {direction === 'en-fr'
                      ? currentCard.englishConjugation
                      : `${currentCard.pronoun} ${currentCard.french}`}
                  </p>
                  <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">Tap to reveal</p>
                </div>
              }
              back={
                <div className="text-center">
                  <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
                  <p className="mt-4 text-2xl font-semibold">
                    {direction === 'en-fr'
                      ? `${currentCard.pronoun} ${currentCard.french}`
                      : currentCard.englishConjugation}
                  </p>
                  <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">
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
