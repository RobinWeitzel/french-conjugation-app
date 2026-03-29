import Dexie, { type EntityTable } from 'dexie';
import type { Verb, Sentence, Stat, Metadata } from './types';

const db = new Dexie('FrenchPracticeDB') as Dexie & {
  verbs: EntityTable<Verb, 'infinitive'>;
  sentences: EntityTable<Sentence, 'id'>;
  stats: EntityTable<Stat, 'id'>;
  metadata: EntityTable<Metadata, 'key'>;
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

export { db };
