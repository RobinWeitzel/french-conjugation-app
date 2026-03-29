import type { TenseKey, Pronoun } from './types';
import packageJson from '../../package.json';

export const APP_VERSION = packageJson.version;

export const TENSES: Record<TenseKey, string> = {
  present: 'Présent',
  passe_compose: 'Passé Composé',
  imparfait: 'Imparfait',
  plus_que_parfait: 'Plus-que-parfait',
  futur: 'Futur Simple',
  futur_proche: 'Futur Proche',
  conditionnel: 'Conditionnel',
  subjonctif: 'Subjonctif',
  imperatif: 'Impératif',
  passe_recent: 'Passé Récent',
  voix_passive: 'Voix Passive',
};

export const PRONOUNS: Pronoun[] = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

export const MASTERY_THRESHOLD = 3;

export const SWIPE_THRESHOLD = 75;
