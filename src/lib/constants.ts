import type { TenseKey, Pronoun } from './types';

export const APP_VERSION = '3.0.0';

export const TENSES: Record<TenseKey, string> = {
  present: 'Présent',
  passe_compose: 'Passé Composé',
  imparfait: 'Imparfait',
  futur: 'Futur Simple',
  conditionnel: 'Conditionnel',
};

export const PRONOUNS: Pronoun[] = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

export const MASTERY_THRESHOLD = 3;

export const SWIPE_THRESHOLD = 75;
