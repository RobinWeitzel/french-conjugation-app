export interface VerbConjugation {
  french: string;
  english: string;
}

export interface TenseConjugations {
  je: VerbConjugation | null;
  tu: VerbConjugation | null;
  il: VerbConjugation | null;
  nous: VerbConjugation | null;
  vous: VerbConjugation | null;
  ils: VerbConjugation | null;
}

export interface Verb {
  infinitive: string;
  english: string;
  tenses: Record<TenseKey, TenseConjugations>;
}

export interface VerbsData {
  version: string;
  verbs: Verb[];
}

export interface Sentence {
  id: string;
  category: string;
  french: string;
  english: string;
}

export interface SentencesData {
  version: string;
  audioCategories: string[];
  categories: Record<string, string>;
  sentences: Sentence[];
}

export interface Stat {
  id: string;
  correctCount: number;
  box: number;          // 1-5 Leitner box
  nextReview: string;   // ISO date string "YYYY-MM-DD"
  lastPracticed: string;
}

export interface Metadata {
  key: string;
  value: string;
}

export type TenseKey = 'present' | 'passe_compose' | 'imparfait' | 'futur' | 'conditionnel' | 'plus_que_parfait' | 'imperatif' | 'subjonctif' | 'futur_proche' | 'passe_recent' | 'voix_passive';
export type Pronoun = 'je' | 'tu' | 'il' | 'nous' | 'vous' | 'ils';
export type Direction = 'en-fr' | 'fr-en';
export type InputMode = 'flashcard' | 'typing';

export interface VerbTier {
  id: number;
  name: string;
  description: string;
  verbs: string[];  // infinitives
}

export interface PracticeCard {
  infinitive: string;
  english: string;
  tense: TenseKey;
  pronoun: Pronoun;
  french: string;
  englishConjugation: string;
  statId: string;
}

export interface ListeningCard {
  id: string;
  category: string;
  french: string;
  english: string;
  statId: string;
}

export interface SessionStats {
  correct: number;
  incorrect: number;
}
