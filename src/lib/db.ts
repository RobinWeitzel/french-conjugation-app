import Dexie, { type EntityTable } from 'dexie';
import type { Verb, Sentence, Stat, Metadata, Activity, GateCompletion } from './types';

const db = new Dexie('FrenchConjugationDB') as Dexie & {
  verbs: EntityTable<Verb, 'infinitive'>;
  sentences: EntityTable<Sentence, 'id'>;
  stats: EntityTable<Stat, 'id'>;
  metadata: EntityTable<Metadata, 'key'>;
  activity: EntityTable<Activity, 'id'>;
  gateCompletions: EntityTable<GateCompletion, 'id'>;
};

db.version(1).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id',
  metadata: 'key',
});

db.version(2).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id, nextReview',
  metadata: 'key',
}).upgrade(async (tx) => {
  const today = new Date().toISOString().split('T')[0]!;
  await tx.table('stats').toCollection().modify((stat: Record<string, unknown>) => {
    if (stat.mastered) {
      stat.box = 5;
      const last = typeof stat.lastPracticed === 'string' && stat.lastPracticed
        ? new Date(stat.lastPracticed)
        : new Date();
      last.setDate(last.getDate() + 30);
      stat.nextReview = last.toISOString().split('T')[0]!;
    } else {
      stat.box = 1;
      stat.nextReview = today;
    }
    delete stat.mastered;
  });
});

db.version(3).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id, nextReview',
  metadata: 'key',
}).upgrade(async (tx) => {
  // Migrate practice stats to include _flashcard suffix
  // Listening stats (prefixed with "listening_") are unchanged
  const stats = await tx.table('stats').toArray();
  for (const stat of stats) {
    if (stat.id.startsWith('listening_')) continue;
    // Already migrated if it ends with _flashcard or _typing
    if (stat.id.endsWith('_flashcard') || stat.id.endsWith('_typing')) continue;
    const newId = `${stat.id}_flashcard`;
    await tx.table('stats').add({ ...stat, id: newId });
    await tx.table('stats').delete(stat.id);
  }
});

db.version(4).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id, nextReview',
  metadata: 'key',
  activity: '++id, date',
});

db.version(5).stores({
  verbs: 'infinitive',
  sentences: 'id, category',
  stats: 'id, nextReview',
  metadata: 'key',
  activity: '++id, date',
  gateCompletions: 'id',
}).upgrade(async (tx) => {
  // Migrate practice stats: add direction suffix
  // Listening stats (prefixed with "listening_") are unchanged
  const stats = await tx.table('stats').toArray();
  for (const stat of stats) {
    if (stat.id.startsWith('listening_')) continue;
    // Already migrated if it ends with _enfr or _fren
    if (stat.id.endsWith('_enfr') || stat.id.endsWith('_fren')) continue;

    // Create copies for both directions
    const enfrId = `${stat.id}_enfr`;
    const frenId = `${stat.id}_fren`;
    await tx.table('stats').add({ ...stat, id: enfrId });
    await tx.table('stats').add({ ...stat, id: frenId });
    await tx.table('stats').delete(stat.id);
  }

  // Note: gateCompletions pre-population will be done at app startup
  // by computeGateStatuses, not during migration, to avoid importing
  // the full gate logic into the migration code.
});

export { db };
