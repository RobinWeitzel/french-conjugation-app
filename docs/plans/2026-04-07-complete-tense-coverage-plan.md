# Complete Tense Coverage Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add conjugation data for 8 missing tenses across all 100 verbs, add 2 new tense types, and add 3 grammar reference sections.

**Architecture:** Extend existing type system with 2 new TenseKey values, generate conjugation data for all 100 verbs using a script, and add grammar topics to the existing grammarData.ts structure.

**Tech Stack:** TypeScript, JSON, Python (for data generation script)

---

### Task 1: Add new tense keys to types and constants

**Files:**
- Modify: `src/lib/types.ts:61`
- Modify: `src/lib/constants.ts:6-18`

**Step 1: Update TenseKey type**

In `src/lib/types.ts`, change line 61 from:

```typescript
export type TenseKey = 'present' | 'passe_compose' | 'imparfait' | 'futur' | 'conditionnel' | 'plus_que_parfait' | 'imperatif' | 'subjonctif' | 'futur_proche' | 'passe_recent' | 'voix_passive';
```

to:

```typescript
export type TenseKey = 'present' | 'passe_compose' | 'imparfait' | 'futur' | 'conditionnel' | 'plus_que_parfait' | 'imperatif' | 'subjonctif' | 'futur_proche' | 'passe_recent' | 'voix_passive' | 'passe_simple' | 'conditionnel_passe';
```

**Step 2: Update TENSES constant**

In `src/lib/constants.ts`, add two entries to the TENSES record (after `voix_passive`):

```typescript
passe_simple: 'Passé Simple',
conditionnel_passe: 'Conditionnel Passé',
```

**Step 3: Verify TypeScript compiles**

Run: `npx tsc --noEmit`
Expected: Compilation errors about missing tense keys in words.json data (expected at this stage, will be resolved in Task 2).

**Step 4: Commit**

```bash
git add src/lib/types.ts src/lib/constants.ts
git commit -m "feat: add passe_simple and conditionnel_passe tense keys"
```

---

### Task 2: Generate conjugation data for all missing tenses

**Files:**
- Create: `scripts/generate-tenses.py` (temporary script, delete after use)
- Modify: `words.json`

This is the largest task. A Python script will generate correct French conjugation data for all 100 verbs across the 8 missing tenses. The script must handle:

- **Plus-que-parfait**: auxiliary (avoir/être) in imparfait + past participle
- **Futur Proche**: conjugated aller in present + infinitive
- **Subjonctif Présent**: irregular stems for common verbs, regular formation from ils-present stem
- **Impératif**: tu/nous/vous forms only, je/il/ils = null; -er verbs drop -s in tu form
- **Passé Récent**: conjugated venir in present + "de" + infinitive
- **Voix Passive**: être in present + past participle; only transitive verbs; intransitive = all null
- **Passé Simple**: regular and irregular formations
- **Conditionnel Passé**: auxiliary (avoir/être) in conditionnel + past participle

**Step 1: Write the generation script**

Create `scripts/generate-tenses.py`. This script must:

1. Read `words.json`
2. For each of the 100 verbs, generate conjugation entries for all 8 missing tenses
3. Use hardcoded conjugation data — do NOT attempt to algorithmically conjugate. Each verb's forms must be explicitly correct.
4. Write the updated `words.json` with version `"3.0.0"`

**CRITICAL:** French conjugation is highly irregular. The script must contain a complete lookup table of all conjugations for all 100 verbs. Do not try to derive conjugations from rules — too many exceptions exist. Use authoritative conjugation references.

The data format for each tense entry follows the existing pattern:
```json
{
  "je": { "french": "conjugated form", "english": "English translation" },
  "tu": { "french": "conjugated form", "english": "English translation" },
  "il": { "french": "conjugated form", "english": "English translation" },
  "nous": { "french": "conjugated form", "english": "English translation" },
  "vous": { "french": "conjugated form", "english": "English translation" },
  "ils": { "french": "conjugated form", "english": "English translation" }
}
```

For null pronouns (impératif je/il/ils, or voix_passive on intransitive verbs), use `null`.

**Key decisions for each tense:**

**plus_que_parfait:**
- Auxiliary in imparfait + past participle
- Être verbs: aller, venir, devenir, revenir, partir, sortir, arriver, rester, entrer, naître, mourir, tomber
- English: "I had spoken", "you had gone", etc.

**futur_proche:**
- Conjugated aller (present) + infinitive
- English: "I am going to speak", etc.
- French: "vais parler", "vas parler", "va parler", "allons parler", "allez parler", "vont parler"

**subjonctif:**
- Many irregular forms (être, avoir, aller, faire, pouvoir, savoir, vouloir, etc.)
- English: "I speak (subjunctive)" or "I may speak"
- French: regular = ils-present stem + -e, -es, -e, -ions, -iez, -ent

**imperatif:**
- je = null, il = null, ils = null
- tu/nous/vous forms
- -er verbs: tu form drops final -s (parle, not parles)
- English: "speak!", "let's speak!", "speak! (formal)"
- falloir: all null (no imperative)

**passe_recent:**
- Conjugated venir (present) + "de" + infinitive
- English: "I just spoke", etc.
- French: "viens de parler", "viens de parler", "vient de parler", "venons de parler", "venez de parler", "viennent de parler"

**voix_passive:**
- être (present) + past participle
- Only transitive verbs get forms
- Intransitive verbs (aller, venir, partir, arriver, rester, sortir, devenir, revenir, sembler, exister, etc.) = all null
- English: "I am spoken", etc.
- Past participle agrees with subject (use masculine singular for simplicity, note agreement in il form)

**passe_simple:**
- Regular -er: -ai, -as, -a, -âmes, -âtes, -èrent
- Regular -ir/-re: -is, -is, -it, -îmes, -îtes, -irent
- Many irregulars (être → fus, avoir → eus, faire → fis, etc.)
- English: "I spoke", "you spoke", etc. (same as passé composé English)

**conditionnel_passe:**
- Auxiliary (avoir/être) in conditionnel + past participle
- Same être verbs as passé composé/plus-que-parfait
- English: "I would have spoken", "I would have gone", etc.

**Step 2: Run the script**

Run: `python3 scripts/generate-tenses.py`
Expected: Updated `words.json` with all 13 tenses for all 100 verbs.

**Step 3: Validate the output**

Run a validation to check:
- All 100 verbs have exactly 13 tense keys
- Impératif has null for je/il/ils on all verbs
- Falloir has all-null for imperatif
- Intransitive verbs have all-null for voix_passive
- No empty strings in French or English fields
- Version is "3.0.0"

**Step 4: Delete the generation script**

```bash
rm scripts/generate-tenses.py
```

**Step 5: Commit**

```bash
git add words.json
git commit -m "feat: add conjugation data for 8 missing tenses across all 100 verbs"
```

---

### Task 3: Add grammar reference sections

**Files:**
- Modify: `src/data/grammarData.ts`

**Step 1: Add Plus-que-parfait topic to verbs_past section**

Insert a new topic after `pc_vs_imparfait` (line ~630) and before `recent_past` in the `verbs_past` section:

```typescript
{
  id: "plus_que_parfait",
  title: "Plus-que-parfait (Pluperfect)",
  entries: [
    {
      rule: "The plus-que-parfait describes an action that happened before another past action. It is formed with the auxiliary (avoir or être) in the imparfait + past participle.",
      examples: [
        { fr: "J'avais déjà mangé quand il est arrivé.", en: "I had already eaten when he arrived." },
        { fr: "Elle était partie avant nous.", en: "She had left before us." },
      ],
    },
    {
      rule: "Uses the same auxiliary (avoir or être) and past participle as the passé composé. Only the auxiliary changes to the imparfait.",
      examples: [
        { fr: "avoir → j'avais parlé (I had spoken)", en: "" },
        { fr: "être → j'étais allé(e) (I had gone)", en: "" },
      ],
      tip: "Think of it as 'the past of the past' — it sets the scene for events that happened even earlier than another past event.",
    },
  ],
},
```

**Step 2: Add Passé Simple topic to verbs_past section**

Insert after the new plus-que-parfait topic:

```typescript
{
  id: "passe_simple",
  title: "Passé Simple (Literary Past)",
  entries: [
    {
      rule: "The passé simple is used in formal writing and literature to describe completed past actions. Regular -er verbs: -ai, -as, -a, -âmes, -âtes, -èrent.",
      examples: [
        { fr: "parler → je parlai, tu parlas, il parla, nous parlâmes, vous parlâtes, ils parlèrent", en: "" },
      ],
    },
    {
      rule: "Regular -ir and -re verbs: -is, -is, -it, -îmes, -îtes, -irent.",
      examples: [
        { fr: "finir → je finis, tu finis, il finit, nous finîmes, vous finîtes, ils finirent", en: "" },
        { fr: "rendre → je rendis, tu rendis, il rendit, nous rendîmes, vous rendîtes, ils rendirent", en: "" },
      ],
    },
    {
      rule: "Common irregular passé simple forms.",
      examples: [
        { fr: "être → je fus, tu fus, il fut, nous fûmes, vous fûtes, ils furent", en: "" },
        { fr: "avoir → j'eus, tu eus, il eut, nous eûmes, vous eûtes, ils eurent", en: "" },
        { fr: "faire → je fis, voir → je vis, prendre → je pris, venir → je vins", en: "" },
      ],
      tip: "The passé simple is almost never used in spoken French. You will encounter it mainly in novels, historical texts, and formal writing. For everyday speech, use the passé composé instead.",
    },
  ],
},
```

**Step 3: Add Conditionnel Passé topic to verbs_future_conditional section**

Insert after the `conditional` topic (line ~718) in the `verbs_future_conditional` section:

```typescript
{
  id: "conditionnel_passe",
  title: "Conditionnel Passé (Past Conditional)",
  entries: [
    {
      rule: "The conditionnel passé expresses what would have happened. It is formed with the auxiliary (avoir or être) in the conditionnel + past participle.",
      examples: [
        { fr: "J'aurais aimé venir.", en: "I would have liked to come." },
        { fr: "Elle serait partie plus tôt.", en: "She would have left earlier." },
      ],
    },
    {
      rule: "Used for regrets, reproaches, and unrealized hypothetical situations in the past.",
      examples: [
        { fr: "J'aurais dû étudier.", en: "I should have studied." },
        { fr: "Tu aurais pu m'aider.", en: "You could have helped me." },
      ],
    },
    {
      rule: "In 'if' clauses about the past: si + plus-que-parfait → conditionnel passé.",
      examples: [
        { fr: "Si j'avais su, j'aurais agi différemment.", en: "If I had known, I would have acted differently." },
        { fr: "Si elle était venue, nous aurions été contents.", en: "If she had come, we would have been happy." },
      ],
      tip: "Like with the present conditional, never use the conditionnel passé after 'si' — only in the result clause.",
    },
  ],
},
```

**Step 4: Verify the app builds**

Run: `npx tsc --noEmit && npm run build`
Expected: Clean build with no errors.

**Step 5: Commit**

```bash
git add src/data/grammarData.ts
git commit -m "feat: add grammar reference for plus-que-parfait, passé simple, and conditionnel passé"
```

---

### Task 4: Bump version

**Files:**
- Modify: `package.json:3`

**Step 1: Bump version in package.json**

Change `"version": "6.10.0"` to `"version": "6.11.0"`.

**Step 2: Build and verify**

Run: `npm run build`
Expected: Clean build. The prebuild script generates `public/version.json` from package.json automatically.

**Step 3: Commit**

```bash
git add package.json
git commit -m "chore: bump version to 6.11.0"
```

---

### Task 5: Final verification

**Step 1: Run full build**

Run: `npm run build`
Expected: Clean build, no errors.

**Step 2: Validate words.json integrity**

Run a quick validation:
```bash
python3 -c "
import json
with open('words.json') as f:
    data = json.load(f)
assert data['version'] == '3.0.0'
assert len(data['verbs']) == 100
expected_tenses = ['present','passe_compose','imparfait','futur','conditionnel','plus_que_parfait','imperatif','subjonctif','futur_proche','passe_recent','voix_passive','passe_simple','conditionnel_passe']
for v in data['verbs']:
    assert set(v['tenses'].keys()) == set(expected_tenses), f'{v[\"infinitive\"]} missing tenses: {set(expected_tenses) - set(v[\"tenses\"].keys())}'
    # Check imperatif has null for je/il/ils
    imp = v['tenses']['imperatif']
    assert imp['je'] is None, f'{v[\"infinitive\"]} imperatif je should be null'
    assert imp['il'] is None, f'{v[\"infinitive\"]} imperatif il should be null'
    assert imp['ils'] is None, f'{v[\"infinitive\"]} imperatif ils should be null'
print('All 100 verbs validated with 13 tenses each')
"
```

**Step 3: Start dev server and manually verify**

Run: dev server
Check:
- Practice setup page shows all 13 tenses as selectable options
- Grammar reference shows Plus-que-parfait, Passé Simple, and Conditionnel Passé sections
- Selecting a new tense (e.g., Plus-que-parfait) and starting practice loads cards correctly

---

## Summary of all changes

| File | Change |
|------|--------|
| `src/lib/types.ts` | Add `passe_simple`, `conditionnel_passe` to TenseKey union |
| `src/lib/constants.ts` | Add 2 entries to TENSES record |
| `words.json` | Add 8 tenses to all 100 verbs, bump version to 3.0.0 |
| `src/data/grammarData.ts` | Add 3 grammar topics (Plus-que-parfait, Passé Simple, Conditionnel Passé) |
| `package.json` | Bump version to 6.11.0 |
