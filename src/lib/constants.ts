import type { TenseKey, Pronoun, VerbTier } from './types';
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
  passe_simple: 'Passé Simple',
  conditionnel_passe: 'Conditionnel Passé',
};

export const PRONOUNS: Pronoun[] = ['je', 'tu', 'il', 'nous', 'vous', 'ils'];

export const MASTERY_THRESHOLD = 3;

export const SWIPE_THRESHOLD = 75;

export const BOX_INTERVALS: Record<number, number> = {
  1: 0,   // review now
  2: 1,   // 1 day
  3: 3,   // 3 days
  4: 7,   // 7 days
  5: 30,  // 30 days
};

export const MAX_BOX = 5;
export const TIER_UNLOCK_THRESHOLD = 0.7; // 70%
export const TIER_UNLOCK_MIN_BOX = 3;

export const ACCENT_CHARS = ['é', 'è', 'ê', 'ë', 'à', 'â', 'ù', 'û', 'ü', 'ï', 'î', 'ô', 'ç', 'æ', 'œ'] as const;

export const VERB_TIERS: VerbTier[] = [
  {
    id: 1,
    name: 'Essential',
    description: 'Most common verbs',
    verbs: ['être', 'avoir', 'aller', 'faire', 'pouvoir', 'vouloir', 'devoir', 'savoir', 'prendre', 'venir', 'dire', 'voir', 'falloir', 'donner', 'mettre'],
  },
  {
    id: 2,
    name: 'Common -er',
    description: 'Regular -er pattern verbs',
    verbs: ['parler', 'trouver', 'passer', 'demander', 'montrer', 'continuer', 'rester', 'porter', 'commencer', 'compter', 'penser', 'arriver', 'laisser', 'jouer', 'aimer', 'chercher', 'travailler', 'essayer', 'changer', 'créer', 'entrer', 'préparer', 'utiliser', 'proposer', 'apporter'],
  },
  {
    id: 3,
    name: '-ir/-re & Irregulars',
    description: 'Regular -ir/-re and common irregulars',
    verbs: ['partir', 'sortir', 'servir', 'agir', 'réussir', 'choisir', 'rendre', 'répondre', 'attendre', 'perdre', 'défendre', 'suivre', 'vivre', 'lire', 'écrire', 'ouvrir', 'produire', 'atteindre', 'connaître', 'croire'],
  },
  {
    id: 4,
    name: 'Advanced',
    description: 'Less common and remaining verbs',
    verbs: [], // Computed at runtime: all verbs not in tiers 1-3
  },
];
