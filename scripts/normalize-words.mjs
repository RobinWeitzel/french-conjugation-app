// One-time script to strip pronoun prefixes from compound tenses in words.json
// Compound tenses store "je vais être" but should store "vais être" (bare verb form)
// to match the convention used by simple tenses.

import { readFileSync, writeFileSync } from 'fs';

const PRONOUNS = ['je', 'tu', 'il', 'elle', 'on', 'nous', 'vous', 'ils', 'elles'];
const COMPOUND_TENSES = ['plus_que_parfait', 'futur_proche', 'passe_recent', 'voix_passive'];

function stripPronoun(pronoun, french) {
  // Handle j' elision (e.g. "j'avais été" → "avais été")
  if (french.startsWith("j'")) {
    return french.slice(2);
  }
  // Handle regular pronoun + space (e.g. "je vais être" → "vais être")
  const prefix = pronoun + ' ';
  if (french.startsWith(prefix)) {
    return french.slice(prefix.length);
  }
  // Also check for il/elle/on variants that might not match the key
  for (const p of PRONOUNS) {
    if (french.startsWith(p + ' ')) {
      return french.slice(p.length + 1);
    }
    if (french.startsWith(p + "'")) {
      return french.slice(p.length + 1);
    }
  }
  return french;
}

const data = JSON.parse(readFileSync('public/words.json', 'utf8'));
let changes = 0;

for (const verb of data.verbs) {
  for (const tense of COMPOUND_TENSES) {
    const tenseData = verb.tenses[tense];
    if (!tenseData) continue;

    for (const [pronoun, conjugation] of Object.entries(tenseData)) {
      if (!conjugation) continue; // null entries (impersonal verbs)
      const original = conjugation.french;
      const stripped = stripPronoun(pronoun, original);
      if (stripped !== original) {
        conjugation.french = stripped;
        changes++;
      }
    }
  }
}

writeFileSync('public/words.json', JSON.stringify(data, null, 2) + '\n');
console.log(`Done. ${changes} french fields normalized.`);
