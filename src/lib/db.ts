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

export { db };
