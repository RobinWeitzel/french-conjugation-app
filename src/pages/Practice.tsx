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
import { useAudio } from '../hooks/useAudio';
import { TENSES, PRONOUNS } from '../lib/constants';
import { computeGateStatuses, getGateChain, getFrontierIndex, getVerbsForTier, makeStatId } from '../lib/gates';
import type { PracticeCard, TenseConjugations, InputMode } from '../lib/types';
import { formatPronounVerb } from '../lib/utils';
import { db } from '../lib/db';

function normalizeAnswer(s: string): string {
  return s.trim().toLowerCase();
}

/** After shuffling, rearrange so consecutive cards don't share the same infinitive */
function spreadByInfinitive(cards: PracticeCard[]): void {
  for (let i = 1; i < cards.length; i++) {
    if (cards[i]!.infinitive === cards[i - 1]!.infinitive) {
      for (let j = i + 1; j < cards.length; j++) {
        if (cards[j]!.infinitive !== cards[i - 1]!.infinitive) {
          const temp = cards[i]!;
          cards[i] = cards[j]!;
          cards[j] = temp;
          break;
        }
      }
    }
  }
}

/** Swap the card at index with a different-infinitive card if it matches the given infinitive */
function swapToAvoidVerb(cards: PracticeCard[], index: number, infinitive: string): PracticeCard[] {
  if (cards.length <= 1 || cards[index]?.infinitive !== infinitive) return cards;
  const next = [...cards];
  for (let j = 1; j < next.length; j++) {
    const k = (index + j) % next.length;
    if (next[k]!.infinitive !== infinitive) {
      next[index] = cards[k]!;
      next[k] = cards[index]!;
      return next;
    }
  }
  return cards;
}

export function Practice() {
  const verbs = useVerbs();
  const { direction, showInfinitive, tenses, gateOverrides } = usePracticeSettings();
  const { sessionStats, recordCorrect, recordIncorrect, undo } = useMastery('conjugation', direction);
  const { flipped, flip, reset: resetFlip } = useFlipState();
  const swipeRef = useRef<SwipeContainerHandle>(null);
  const { playAudio, stop, playing } = useAudio(1);
  const [ttsMuted, setTtsMuted] = useState(() => {
    const stored = localStorage.getItem('practiceTtsMuted');
    return stored === 'true';
  });
  const toggleMute = useCallback(() => {
    setTtsMuted((prev) => {
      const next = !prev;
      localStorage.setItem('practiceTtsMuted', JSON.stringify(next));
      if (next) stop();
      return next;
    });
  }, [stop]);
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
  const [initialDueCount, setInitialDueCount] = useState(0);

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

            const statId = makeStatId(verb.infinitive, pronoun, tense, mode, direction);
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

      // Spread out cards so the same verb doesn't appear consecutively
      spreadByInfinitive(allCards);

      setCards(allCards);
      setCurrentIndex(0);
      setInitialDueCount(allCards.length);
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

  const playFrench = useCallback(() => {
    if (!currentCard) return;
    playAudio(formatPronounVerb(currentCard.pronoun, currentCard.french));
  }, [currentCard, playAudio]);

  // Auto-play TTS when French text becomes visible
  // fr-en: French is on the front, play on card load
  // en-fr: French is on the back, play on flip
  useEffect(() => {
    if (!currentCard || ttsMuted) return;
    if (direction === 'fr-en' && !flipped) {
      const timeout = setTimeout(playFrench, 300);
      return () => clearTimeout(timeout);
    }
    if (direction === 'en-fr' && flipped) {
      const timeout = setTimeout(playFrench, 300);
      return () => clearTimeout(timeout);
    }
  }, [currentIndex, currentCard, direction, flipped, ttsMuted, playFrench]);

  const nextCard = useCallback(() => {
    stop();
    resetFlip();
    setTypingResult(null);
    const nextIdx = currentIndex < cards.length - 1 ? currentIndex + 1 : 0;
    if (currentCard && cards[nextIdx]?.infinitive === currentCard.infinitive) {
      setCards(prev => swapToAvoidVerb(prev, nextIdx, currentCard.infinitive));
    }
    setCurrentIndex(nextIdx);
  }, [currentIndex, cards, currentCard, resetFlip, stop]);

  const handleSwipeRight = useCallback(async () => {
    if (!currentCard) return;
    lastSwipeRef.current = { card: currentCard, index: currentIndex, wasRemoved: false };
    const removed = await recordCorrect(currentCard.statId);
    if (removed) {
      lastSwipeRef.current.wasRemoved = true;
      stop();
      setCards((prev) => {
        const filtered = prev.filter((c) => c.statId !== currentCard.statId);
        if (filtered.length === 0) return filtered;
        let newIdx = currentIndex;
        if (currentIndex >= filtered.length) {
          newIdx = 0;
          setCurrentIndex(0);
        }
        return swapToAvoidVerb(filtered, newIdx, currentCard.infinitive);
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

  const handleBackToSetup = () => {
    window.location.href = '/practice-setup';
  };

  const totalCards = initialDueCount;

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
        <Navigation title="Practice" backTo="/practice-setup" />
        <div className="flex flex-1 items-center justify-center">
          <p className="text-slate-500 dark:text-slate-400">Loading...</p>
        </div>
      </PageLayout>
    );
  }

  if (allDone) {
    const attempted = sessionStats.correct + sessionStats.incorrect;
    const noPracticeDone = initialDueCount === 0;

    return (
      <PageLayout>
        <Navigation title="Practice" backTo="/practice-setup" />
        <div className="flex flex-1 flex-col items-center justify-center gap-6">
          <div className="text-center">
            {noPracticeDone ? (
              <>
                <p className="text-4xl">📅</p>
                <h2 className="mt-4 text-xl font-semibold">Nothing to practice right now</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  {nextReviewLabel
                    ? `Next review ${nextReviewLabel}. Come back then!`
                    : 'All cards are scheduled for later.'}
                </p>
              </>
            ) : hasScheduledCards ? (
              <>
                <p className="text-4xl">✅</p>
                <h2 className="mt-4 text-xl font-semibold">All caught up!</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  You practiced {attempted} {attempted === 1 ? 'card' : 'cards'}
                  {attempted > 0 && ` (${Math.round((sessionStats.correct / attempted) * 100)}% accuracy)`}.
                </p>
                <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                  Next review {nextReviewLabel}. Come back then to keep your streak!
                </p>
              </>
            ) : (
              <>
                <p className="text-4xl">🎉</p>
                <h2 className="mt-4 text-xl font-semibold">All mastered!</h2>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
                  You've mastered all cards in the selected tenses.
                </p>
              </>
            )}
          </div>
          <button
            onClick={handleBackToSetup}
            className="rounded-xl bg-indigo-500 px-8 py-3 font-semibold text-white shadow-sm transition-colors hover:bg-indigo-600"
          >
            Back to Setup
          </button>
        </div>
        {!noPracticeDone && (
          <StatsBar stats={sessionStats} remaining={0} total={totalCards} />
        )}
      </PageLayout>
    );
  }

  const ttsPlayButton = (
    <button
      onClick={(e) => {
        e.stopPropagation();
        if (playing) stop();
        else playFrench();
      }}
      className="inline-flex size-7 items-center justify-center rounded-full bg-indigo-50 text-indigo-500 transition-colors hover:bg-indigo-100 dark:bg-indigo-500/10 dark:text-indigo-400 dark:hover:bg-indigo-500/20"
      aria-label={playing ? 'Stop audio' : 'Play audio'}
    >
      {playing ? (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
          <path fillRule="evenodd" d="M6.75 5.25a.75.75 0 0 1 .75-.75H9a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H7.5a.75.75 0 0 1-.75-.75V5.25Zm7.5 0A.75.75 0 0 1 15 4.5h1.5a.75.75 0 0 1 .75.75v13.5a.75.75 0 0 1-.75.75H15a.75.75 0 0 1-.75-.75V5.25Z" clipRule="evenodd" />
        </svg>
      ) : (
        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-3.5">
          <path fillRule="evenodd" d="M4.5 5.653c0-1.427 1.529-2.33 2.779-1.643l11.54 6.347c1.295.712 1.295 2.573 0 3.286L7.28 19.99c-1.25.687-2.779-.217-2.779-1.643V5.653Z" clipRule="evenodd" />
        </svg>
      )}
    </button>
  );

  const frontContent = currentCard && (
    <div className="text-center">
      {showInfinitive && (
        <p className="mb-2 text-xs font-medium text-slate-400 dark:text-slate-500">
          {currentCard.infinitive} ({currentCard.english})
        </p>
      )}
      <p className="text-xs text-slate-400 dark:text-slate-500">{TENSES[currentCard.tense]}</p>
      {direction === 'fr-en' && cardMode !== 'typing' ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          <p className="text-2xl font-semibold">
            {formatPronounVerb(currentCard.pronoun, currentCard.french)}
          </p>
          {ttsPlayButton}
        </div>
      ) : (
        <p className="mt-4 text-2xl font-semibold">
          {direction === 'en-fr'
            ? currentCard.englishConjugation
            : cardMode === 'typing'
              ? `${currentCard.pronoun === 'je' && /^[aeéèêëàâùûüïîôœæh]/i.test(currentCard.french) ? "j'" : currentCard.pronoun + ' '}___`
              : formatPronounVerb(currentCard.pronoun, currentCard.french)}
        </p>
      )}
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
      {direction === 'en-fr' ? (
        <div className="mt-4 flex items-center justify-center gap-2">
          <p className="text-2xl font-semibold">
            {formatPronounVerb(currentCard.pronoun, currentCard.french)}
          </p>
          {ttsPlayButton}
        </div>
      ) : (
        <p className="mt-4 text-2xl font-semibold">
          {currentCard.englishConjugation}
        </p>
      )}
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
        backTo="/practice-setup"
        rightElement={
          <div className="flex items-center gap-2">
            <button
              onClick={toggleMute}
              className="rounded-lg p-1 text-slate-500 transition-colors hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
              aria-label={ttsMuted ? 'Unmute' : 'Mute'}
            >
              {ttsMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM17.78 9.22a.75.75 0 1 0-1.06 1.06L18.44 12l-1.72 1.72a.75.75 0 1 0 1.06 1.06l1.72-1.72 1.72 1.72a.75.75 0 1 0 1.06-1.06L20.56 12l1.72-1.72a.75.75 0 1 0-1.06-1.06l-1.72 1.72-1.72-1.72Z" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="size-5">
                  <path d="M13.5 4.06c0-1.336-1.616-2.005-2.56-1.06l-4.5 4.5H4.508c-1.141 0-2.318.664-2.66 1.905A9.76 9.76 0 0 0 1.5 12c0 .898.121 1.768.35 2.595.341 1.24 1.518 1.905 2.659 1.905h1.93l4.5 4.5c.945.945 2.561.276 2.561-1.06V4.06ZM18.584 5.106a.75.75 0 0 1 1.06 0c3.808 3.807 3.808 9.98 0 13.788a.75.75 0 0 1-1.06-1.06 8.25 8.25 0 0 0 0-11.668.75.75 0 0 1 0-1.06Z" />
                  <path d="M15.932 7.757a.75.75 0 0 1 1.061 0 6 6 0 0 1 0 8.486.75.75 0 0 1-1.06-1.061 4.5 4.5 0 0 0 0-6.364.75.75 0 0 1 0-1.06Z" />
                </svg>
              )}
            </button>
          </div>
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
