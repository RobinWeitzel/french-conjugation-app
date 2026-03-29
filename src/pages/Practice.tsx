import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { PageLayout } from '../components/PageLayout';
import { Navigation } from '../components/Navigation';
import { Flashcard, useFlipState } from '../components/Flashcard';
import { SwipeContainer, type SwipeContainerHandle } from '../components/SwipeContainer';
import { StatsBar } from '../components/StatsBar';
import { ConjugationTable } from '../components/ConjugationTable';
import { TypingInput } from '../components/TypingInput';
import { useMastery } from '../hooks/useMastery';
import { usePracticeSettings } from '../hooks/useSettings';
import { useVerbs } from '../hooks/useDatabase';
import { TENSES, PRONOUNS } from '../lib/constants';
import { computeGateStatuses, getGateChain, getFrontierIndex, getVerbsForTier } from '../lib/gates';
import type { PracticeCard, TenseConjugations, InputMode } from '../lib/types';
import { formatPronounVerb } from '../lib/utils';
import { db } from '../lib/db';

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase();
}

export function Practice() {
  const verbs = useVerbs();
  const { direction, showInfinitive, tenses, gateOverrides } = usePracticeSettings();
  const { sessionStats, recordCorrect, recordIncorrect, resetStats, resetSession, undo } = useMastery('conjugation');
  const { flipped, flip, reset: resetFlip } = useFlipState();
  const swipeRef = useRef<SwipeContainerHandle>(null);
  const lastSwipeRef = useRef<{
    card: PracticeCard;
    index: number;
    wasRemoved: boolean;
  } | null>(null);
  const [undoAvailable, setUndoAvailable] = useState(false);

  const [cards, setCards] = useState<PracticeCard[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [hasScheduledCards, setHasScheduledCards] = useState(false);
  const [nextReviewDate, setNextReviewDate] = useState<string | null>(null);
  const [typingResult, setTypingResult] = useState<'correct' | 'incorrect' | null>(null);

  const currentCard = cards[currentIndex];
  const cardMode: InputMode = currentCard?.mode ?? 'flashcard';

  useEffect(() => {
    if (!verbs) return;

    const buildCards = async () => {
      const allCards: PracticeCard[] = [];
      const today = new Date().toISOString().split('T')[0]!;
      const allInfinitives = verbs.map((v) => v.infinitive);
      let earliestFuture: string | null = null;

      for (const tense of tenses) {
        // Compute gate statuses for this tense
        const statuses = await computeGateStatuses(tense, direction, allInfinitives, verbs);
        const chain = getGateChain(direction);

        // Determine the active gate: use override if set, otherwise use frontier
        const override = gateOverrides[tense];
        let activeGateIndex: number;

        if (override) {
          // Find the gate in the chain matching the override
          activeGateIndex = chain.findIndex(
            (g) => g.tier === override.tier && g.mode === override.mode
          );
          if (activeGateIndex < 0) activeGateIndex = getFrontierIndex(statuses);
        } else {
          activeGateIndex = getFrontierIndex(statuses);
        }

        const activeGate = chain[activeGateIndex]!;
        // For fr-en direction, force flashcard mode
        const mode: InputMode = direction === 'fr-en' ? 'flashcard' : activeGate.mode;
        const tierVerbs = getVerbsForTier(activeGate.tier, allInfinitives);
        const tierVerbSet = new Set(tierVerbs);

        for (const verb of verbs) {
          if (!tierVerbSet.has(verb.infinitive)) continue;

          const tenseData = verb.tenses[tense];
          if (!tenseData) continue;

          for (const pronoun of PRONOUNS) {
            const conjugation = tenseData[pronoun];
            if (!conjugation) continue;

            const statId = `${verb.infinitive}_${pronoun}_${tense}_${mode}`;
            const stat = await db.stats.get(statId);

            if (stat && stat.nextReview > today) {
              if (!earliestFuture || stat.nextReview < earliestFuture) {
                earliestFuture = stat.nextReview;
              }
              continue;
            }

            allCards.push({
              infinitive: verb.infinitive,
              english: verb.english,
              tense,
              pronoun,
              french: conjugation.french,
              englishConjugation: conjugation.english,
              statId,
              mode,
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
      setHasScheduledCards(earliestFuture !== null);
      setNextReviewDate(earliestFuture);
      setLoading(false);
    };

    buildCards();
  }, [verbs, tenses, direction, gateOverrides]);

  const allDone = !loading && cards.length === 0;

  const currentTenseData: TenseConjugations | null = useMemo(() => {
    if (!currentCard || !verbs) return null;
    const verb = verbs.find((v) => v.infinitive === currentCard.infinitive);
    return verb?.tenses[currentCard.tense] ?? null;
  }, [currentCard, verbs]);

  const nextCard = useCallback(() => {
    resetFlip();
    setTypingResult(null);
    if (currentIndex < cards.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setCurrentIndex(0);
    }
  }, [currentIndex, cards.length, resetFlip]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;
    lastSwipeRef.current = { card: currentCard, index: currentIndex, wasRemoved: false };
    const removed = await recordCorrect(currentCard.statId);
    if (removed) {
      lastSwipeRef.current.wasRemoved = true;
      setCards((prev) => {
        const next = prev.filter((c) => c.statId !== currentCard.statId);
        if (currentIndex >= next.length && next.length > 0) {
          setCurrentIndex(0);
        }
        return next;
      });
      resetFlip();
      setTypingResult(null);
    } else {
      nextCard();
    }
    setUndoAvailable(true);
  }, [currentCard, recordCorrect, nextCard, resetFlip, currentIndex]);

  const handleSwipeLeft = useCallback(async () => {
    if (!currentCard) return;
    lastSwipeRef.current = { card: currentCard, index: currentIndex, wasRemoved: false };
    await recordIncorrect(currentCard.statId);
    nextCard();
    setUndoAvailable(true);
  }, [currentCard, currentIndex, recordIncorrect, nextCard]);

  const handleUndo = useCallback(async () => {
    const lastSwipe = lastSwipeRef.current;
    if (!lastSwipe) return;

    const action = await undo();
    if (!action) return;

    if (lastSwipe.wasRemoved) {
      setCards((prev) => {
        const next = [...prev];
        const insertAt = Math.min(lastSwipe.index, next.length);
        next.splice(insertAt, 0, lastSwipe.card);
        return next;
      });
      setCurrentIndex(lastSwipe.index);
    } else {
      setCurrentIndex(lastSwipe.index);
    }

    resetFlip();
    setTimeout(() => flip(), 50);

    setTypingResult(null);
    lastSwipeRef.current = null;
    setUndoAvailable(false);
  }, [undo, resetFlip, flip]);

  const handleTypingSubmit = useCallback((answer: string) => {
    if (!currentCard) return;
    const expected = normalizeAnswer(formatPronounVerb(currentCard.pronoun, currentCard.french));
    const correct = normalizeAnswer(answer) === expected;
    setTypingResult(correct ? 'correct' : 'incorrect');
    if (!flipped) flip();
  }, [currentCard, flipped, flip]);

  const handleTypingAdvance = useCallback(async () => {
    if (!typingResult || !currentCard) return;
    if (typingResult === 'correct') {
      await handleSwipeRight();
    } else {
      await handleSwipeLeft();
    }
    lastSwipeRef.current = null;
    setUndoAvailable(false);
  }, [typingResult, currentCard, handleSwipeRight, handleSwipeLeft]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (cardMode === 'typing') {
        if (e.key === 'Enter' && typingResult) {
          e.preventDefault();
          handleTypingAdvance();
        }
        return;
      }
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
  }, [flip, flipped, cardMode, typingResult, handleTypingAdvance]);

  const handleReset = async () => {
    await resetStats();
    resetSession();
    setLoading(true);
    window.location.reload();
  };

  const totalCards = cards.length + sessionStats.correct;

  const nextReviewLabel = useMemo(() => {
    if (!nextReviewDate) return null;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const review = new Date(nextReviewDate + 'T00:00:00');
    const diffDays = Math.round((review.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays <= 0) return 'today';
    if (diffDays === 1) return 'tomorrow';
    return `in ${diffDays} days`;
  }, [nextReviewDate]);

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
            <p className="text-4xl">{hasScheduledCards ? '✅' : '🎉'}</p>
            <h2 className="mt-4 text-xl font-semibold">
              {hasScheduledCards ? 'All caught up!' : 'All mastered!'}
            </h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
              {hasScheduledCards
                ? `Next review ${nextReviewLabel}. Come back then to keep your streak!`
                : "You've mastered all cards in the selected tenses."}
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

  const frontContent = currentCard && (
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
          : cardMode === 'typing'
            ? `${currentCard.pronoun === 'je' && /^[aeéèêëàâùûüïîôœæh]/i.test(currentCard.french) ? "j'" : currentCard.pronoun + ' '}___`
            : formatPronounVerb(currentCard.pronoun, currentCard.french)}
      </p>
      {direction === 'en-fr' && currentCard.pronoun === 'tu' && (
        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">singular / informal</p>
      )}
      {direction === 'en-fr' && currentCard.pronoun === 'vous' && (
        <p className="mt-2 text-xs italic text-slate-400 dark:text-slate-500">plural / formal</p>
      )}
      {cardMode === 'flashcard' && (
        <p className="mt-6 text-xs text-slate-400 dark:text-slate-500">Tap to reveal</p>
      )}
    </div>
  );

  const backContent = currentCard && (
    <div className="text-center">
      {typingResult && (
        <p className={`mb-2 text-sm font-semibold ${typingResult === 'correct' ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
          {typingResult === 'correct' ? 'Correct!' : 'Incorrect'}
        </p>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
      <p className="mt-4 text-2xl font-semibold">
        {direction === 'en-fr'
          ? formatPronounVerb(currentCard.pronoun, currentCard.french)
          : currentCard.englishConjugation}
      </p>
      {currentTenseData && (
        <ConjugationTable tenseData={currentTenseData} highlightPronoun={currentCard.pronoun} />
      )}
      <p className="mt-4 text-xs text-slate-400 dark:text-slate-500">
        {cardMode === 'flashcard' ? 'Swipe right if correct, left if not' : 'Press Enter to continue'}
      </p>
    </div>
  );

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
          <>
            {cardMode === 'flashcard' ? (
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
                  front={frontContent}
                  back={backContent}
                />
              </SwipeContainer>
            ) : (
              <div>
                <Flashcard
                  flipped={flipped}
                  onFlip={typingResult ? handleTypingAdvance : () => {}}
                  front={frontContent}
                  back={backContent}
                />
                <div className="mt-4">
                  <TypingInput
                    onSubmit={handleTypingSubmit}
                    disabled={typingResult !== null}
                  />
                </div>
              </div>
            )}
          </>
        )}

        <StatsBar
          stats={sessionStats}
          remaining={cards.length}
          total={totalCards}
          onUndo={undoAvailable && cardMode === 'flashcard' ? handleUndo : undefined}
        />
      </div>
    </PageLayout>
  );
}
