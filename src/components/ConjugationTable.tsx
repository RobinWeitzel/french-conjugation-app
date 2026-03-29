import type { TenseConjugations, Pronoun } from '../lib/types';

interface ConjugationTableProps {
  tenseData: TenseConjugations;
  highlightPronoun: Pronoun;
}

const LEFT_PRONOUNS: Pronoun[] = ['je', 'tu', 'il'];
const RIGHT_PRONOUNS: Pronoun[] = ['nous', 'vous', 'ils'];

export function ConjugationTable({ tenseData, highlightPronoun }: ConjugationTableProps) {
  const rows = LEFT_PRONOUNS.map((lp, i) => ({
    left: { pronoun: lp, data: tenseData[lp] },
    right: { pronoun: RIGHT_PRONOUNS[i]!, data: tenseData[RIGHT_PRONOUNS[i]!] },
  }));

  return (
    <div className="mt-4 w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-sm dark:border-slate-700 dark:bg-slate-800/50">
      <table className="w-full">
        <tbody>
          {rows.map(({ left, right }) => (
            <tr key={left.pronoun}>
              <Cell pronoun={left.pronoun} french={left.data?.french ?? null} highlight={left.pronoun === highlightPronoun} />
              <td className="w-4" />
              <Cell pronoun={right.pronoun} french={right.data?.french ?? null} highlight={right.pronoun === highlightPronoun} />
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function Cell({ pronoun, french, highlight }: { pronoun: string; french: string | null; highlight: boolean }) {
  if (french === null) return <td colSpan={2} />;
  return (
    <>
      <td className={`py-1 pr-2 text-right font-medium ${highlight ? 'text-indigo-600 dark:text-indigo-400' : 'text-slate-400 dark:text-slate-500'}`}>
        {pronoun}
      </td>
      <td className={`py-1 ${highlight ? 'font-semibold text-indigo-600 dark:text-indigo-400' : 'text-slate-700 dark:text-slate-300'}`}>
        {french}
      </td>
    </>
  );
}
