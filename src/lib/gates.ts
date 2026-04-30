import { db } from './db';
import { PRONOUNS, VERB_TIERS, TIER_UNLOCK_THRESHOLD, TIER_UNLOCK_MIN_BOX } from './constants';
import type { Gate, GateStatus, TenseKey, Verb, Direction } from './types';

// The 8-gate linear chain for en-fr direction
export const FULL_GATE_CHAIN: Gate[] = [
  { tier: 1, mode: 'flashcard' },
  { tier: 1, mode: 'typing' },
  { tier: 2, mode: 'flashcard' },
  { tier: 2, mode: 'typing' },
  { tier: 3, mode: 'flashcard' },
  { tier: 3, mode: 'typing' },
  { tier: 4, mode: 'flashcard' },
  { tier: 4, mode: 'typing' },
];

// The 4-gate chain for fr-en direction (no typing)
export const FLASHCARD_ONLY_CHAIN: Gate[] = [
  { tier: 1, mode: 'flashcard' },
  { tier: 2, mode: 'flashcard' },
  { tier: 3, mode: 'flashcard' },
  { tier: 4, mode: 'flashcard' },
];

export function getGateChain(direction: 'en-fr' | 'fr-en'): Gate[] {
  return direction === 'en-fr' ? FULL_GATE_CHAIN : FLASHCARD_ONLY_CHAIN;
}

export function getVerbsForTier(tierId: number, allVerbs: string[]): string[] {
  const tier = VERB_TIERS.find((t) => t.id === tierId);
  if (!tier) return [];
  if (tier.verbs.length > 0) return tier.verbs;
  // Tier 4: all verbs not in other tiers
  const otherVerbs = new Set(VERB_TIERS.filter((t) => t.verbs.length > 0).flatMap((t) => t.verbs));
  return allVerbs.filter((v) => !otherVerbs.has(v));
}

function directionSuffix(direction: Direction): string {
  return direction === 'en-fr' ? 'enfr' : 'fren';
}

export function makeStatId(
  infinitive: string,
  pronoun: string,
  tense: TenseKey,
  mode: string,
  direction: Direction,
): string {
  return `${infinitive}_${pronoun}_${tense}_${mode}_${directionSuffix(direction)}`;
}

function makeGateCompletionId(
  tense: TenseKey,
  direction: Direction,
  tier: number,
  mode: string,
): string {
  return `${tense}_${directionSuffix(direction)}_${tier}_${mode}`;
}

export async function computeGateStatuses(
  tense: TenseKey,
  direction: Direction,
  allVerbs: string[],
  verbData?: Verb[],
  persistCompletions = false,
): Promise<GateStatus[]> {
  const chain = getGateChain(direction);
  const verbMap = verbData ? new Map(verbData.map((v) => [v.infinitive, v])) : null;

  // Pass 1: collect all stat IDs and completion IDs
  const allStatIds: string[] = [];
  const allCompletionIds: string[] = [];
  const gateStatIdRanges: { start: number; count: number }[] = [];

  for (const gate of chain) {
    const tierVerbs = getVerbsForTier(gate.tier, allVerbs);
    allCompletionIds.push(makeGateCompletionId(tense, direction, gate.tier, gate.mode));

    const start = allStatIds.length;
    for (const infinitive of tierVerbs) {
      for (const pronoun of PRONOUNS) {
        if (verbMap) {
          const verb = verbMap.get(infinitive);
          if (verb && !verb.tenses[tense]?.[pronoun]) continue;
        }
        allStatIds.push(makeStatId(infinitive, pronoun, tense, gate.mode, direction));
      }
    }
    gateStatIdRanges.push({ start, count: allStatIds.length - start });
  }

  // Bulk fetch everything in 2 queries instead of N*M individual reads
  const [allStatsResults, allCompletionResults] = await Promise.all([
    db.stats.bulkGet(allStatIds),
    db.gateCompletions.bulkGet(allCompletionIds),
  ]);

  // Pass 2: compute statuses from prefetched data
  const results: GateStatus[] = [];
  // Tier progression flows through flashcard gates only. Typing gates unlock
  // from the same tier's flashcard completion but do not gate later tiers.
  let previousFlashcardCompleted = true;
  let currentTierFlashcardCompleted = false;

  for (let gi = 0; gi < chain.length; gi++) {
    const gate = chain[gi]!;
    const { start, count } = gateStatIdRanges[gi]!;
    const existingCompletion = allCompletionResults[gi];

    let total = 0;
    let atLevel = 0;
    let box1 = 0;
    let box2 = 0;
    let box3plus = 0;

    for (let i = start; i < start + count; i++) {
      total++;
      const stat = allStatsResults[i];
      if (stat && stat.box >= TIER_UNLOCK_MIN_BOX) {
        atLevel++;
        box3plus++;
      } else if (stat && stat.box === 2) {
        box2++;
      } else {
        box1++;
      }
    }

    const ratio = total > 0 ? atLevel / total : 0;
    const unlocked: boolean =
      gate.mode === 'flashcard' ? previousFlashcardCompleted : currentTierFlashcardCompleted;
    let completed: boolean;

    if (existingCompletion) {
      completed = true;
    } else {
      completed = unlocked && ratio >= TIER_UNLOCK_THRESHOLD;
      if (completed && persistCompletions) {
        await db.gateCompletions.put({
          id: makeGateCompletionId(tense, direction, gate.tier, gate.mode),
          tense,
          direction,
          tier: gate.tier,
          mode: gate.mode,
          completedAt: new Date().toISOString(),
        });
      }
    }

    results.push({
      gate,
      unlocked,
      completed,
      progress: { current: atLevel, total },
      boxDistribution: { box1, box2, box3plus },
    });

    if (gate.mode === 'flashcard') {
      currentTierFlashcardCompleted = completed;
      previousFlashcardCompleted = completed;
    }
  }

  return results;
}

// Find the frontier gate: first unlocked but not completed gate
export function getFrontierIndex(statuses: GateStatus[]): number {
  const idx = statuses.findIndex((s) => s.unlocked && !s.completed);
  return idx >= 0 ? idx : statuses.length - 1;
}
