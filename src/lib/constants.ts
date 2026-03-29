import type { TenseKey, Pronoun } from './types';
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;

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
