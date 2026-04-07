# Complete Tense Coverage Design

## Problem

The app defines 11 tenses in constants but only 5 have conjugation data in `words.json`. Additionally, two common French tenses (Passé Simple, Conditionnel Passé) are missing entirely. The grammar reference is also missing sections for Plus-que-parfait, Passé Simple, and Conditionnel Passé.

## Scope

### New tenses (add to types, constants, words.json, grammar)

| Key | Display Name | Notes |
|-----|-------------|-------|
| `passe_simple` | Passé Simple | Literary past tense; grammar tip about limited spoken usage |
| `conditionnel_passe` | Conditionnel Passé | Past conditional for regrets/hypotheticals |

### Existing tenses needing conjugation data in words.json

| Key | Display Name | Pronoun Handling |
|-----|-------------|-----------------|
| `plus_que_parfait` | Plus-que-parfait | All 6 pronouns |
| `futur_proche` | Futur Proche | All 6 pronouns; format: conjugated aller + infinitive |
| `subjonctif` | Subjonctif | All 6 pronouns |
| `imperatif` | Impératif | tu/nous/vous only; je/il/ils = null |
| `passe_recent` | Passé Récent | All 6 pronouns; format: conjugated venir + de + infinitive |
| `voix_passive` | Voix Passive | Transitive verbs only; intransitive verbs get all-null pronouns |

### Grammar reference additions

| Topic | Section | Content |
|-------|---------|---------|
| Plus-que-parfait | `verbs_past` | Formation (auxiliary imparfait + past participle), usage for events before other past events |
| Passé Simple | `verbs_past` | Regular formations (-er, -ir, -re), common irregulars, literary usage tip |
| Conditionnel Passé | `verbs_future_conditional` | Formation (conditional of avoir/être + past participle), usage for regrets and hypotheticals |

## Data Decisions

- **words.json version**: Bump to `3.0.0` (breaking: new tense keys added to all verbs)
- **Null pronouns**: Use `null` for non-applicable pronouns (same pattern as `falloir`)
- **Voix Passive**: Only transitive verbs get conjugated forms; intransitive verbs have all-null pronouns
- **Futur Proche format**: `"vais parler"`, `"vas parler"`, etc.
- **Passé Récent format**: `"viens de parler"`, `"viens de parler"`, etc.

## Files to Modify

1. `src/lib/types.ts` — Add `'passe_simple' | 'conditionnel_passe'` to `TenseKey`
2. `src/lib/constants.ts` — Add entries to `TENSES` record
3. `words.json` — Add 8 new tense entries to all 100 verbs, bump version to 3.0.0
4. `src/data/grammarData.ts` — Add 3 new grammar topics
5. `package.json` — Bump version
