import { db } from './db';
import { PRONOUNS, VERB_TIERS, TIER_UNLOCK_THRESHOLD, TIER_UNLOCK_MIN_BOX } from './constants';
import type { Gate, GateStatus, TenseKey, Verb } from './types';

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

export async function computeGateStatuses(
  tense: TenseKey,
  direction: 'en-fr' | 'fr-en',
  allVerbs: string[],
  verbData?: Verb[],
): Promise<GateStatus[]> {
  const chain = getGateChain(direction);
  const results: GateStatus[] = [];
  let previousCompleted = true; // Gate 0 (before T1F) is always "completed"
  const verbMap = verbData ? new Map(verbData.map((v) => [v.infinitive, v])) : null;

  for (const gate of chain) {
    const tierVerbs = getVerbsForTier(gate.tier, allVerbs);
    let total = 0;
    let atLevel = 0;

    for (const infinitive of tierVerbs) {
      for (const pronoun of PRONOUNS) {
        // Skip pronouns with no conjugation (e.g. falloir only has "il")
        if (verbMap) {
          const verb = verbMap.get(infinitive);
          if (verb && !verb.tenses[tense]?.[pronoun]) continue;
        }
        const statId = `${infinitive}_${pronoun}_${tense}_${gate.mode}`;
        total++;
        const stat = await db.stats.get(statId);
        if (stat && stat.box >= TIER_UNLOCK_MIN_BOX) {
          atLevel++;
        }
      }
    }

    const ratio = total > 0 ? atLevel / total : 0;
    const unlocked: boolean = previousCompleted;
    const completed: boolean = unlocked && ratio >= TIER_UNLOCK_THRESHOLD;

    results.push({
      gate,
      unlocked,
      completed,
      progress: { current: atLevel, total },
    });

    previousCompleted = completed;
  }

  return results;
}

// Find the frontier gate: first unlocked but not completed gate
export function getFrontierIndex(statuses: GateStatus[]): number {
  const idx = statuses.findIndex((s) => s.unlocked && !s.completed);
  return idx >= 0 ? idx : statuses.length - 1; // If all completed, use last gate
}
