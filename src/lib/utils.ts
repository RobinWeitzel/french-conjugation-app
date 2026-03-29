const ELISION_RE = /^[aeéèêëàâùûüïîôœæh]/i;

export function formatPronounVerb(pronoun: string, french: string): string {
  if (pronoun === 'je' && ELISION_RE.test(french)) {
    return `j'${french}`;
  }
  return `${pronoun} ${french}`;
}
