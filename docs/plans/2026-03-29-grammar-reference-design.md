# Grammar Reference Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a two-level grammar reference section (index + detail pages) with 14 sections of French grammar content, accessible from the Home screen.

**Architecture:** Two new page components (`GrammarIndex`, `GrammarSection`) with content hardcoded in a data file. Reuses existing `PageLayout` and `Navigation` components. Two new routes added to `App.tsx`.

**Tech Stack:** React, TypeScript, Tailwind CSS, React Router (HashRouter)

---

### Task 1: Create grammar data file

**Files:**
- Create: `src/data/grammarData.ts`

**Step 1: Create the data file**

Create `src/data/grammarData.ts` containing all 14 grammar sections as a TypeScript constant. The data structure:

```typescript
export interface GrammarExample {
  fr: string;
  en: string;
}

export interface GrammarEntry {
  rule: string;
  examples: GrammarExample[];
  tip?: string;
  warning?: string;
}

export interface GrammarTopic {
  id: string;
  title: string;
  entries: GrammarEntry[];
}

export interface GrammarSection {
  id: string;
  title: string;
  icon: string; // icon identifier for mapping to SVG
  topics: GrammarTopic[];
}

export const grammarSections: GrammarSection[] = [
  // All 14 sections with full content from french_grammar_reference.json
];
```

Read the full content from `/Users/robinweitzel/Downloads/french_grammar_reference.json` and convert it to the TypeScript constant. Include ALL sections, topics, entries, examples, tips, and warnings exactly as they appear in the JSON.

**Step 2: Commit**

```bash
git add src/data/grammarData.ts
git commit -m "feat: add grammar reference data with 14 sections"
```

---

### Task 2: Create GrammarIndex page

**Files:**
- Create: `src/pages/GrammarIndex.tsx`

**Step 1: Create the page**

Create `src/pages/GrammarIndex.tsx` that:
- Uses `PageLayout` and `Navigation` (with title "Grammar Reference")
- Imports `grammarSections` from `../data/grammarData`
- Renders each section as a card (same rounded-2xl card style used on Home page for consistency)
- Each card shows: an icon (use inline SVGs matching the icon identifiers — book-open, user, zap, clock, arrow-right, layers, palette, gauge, x-circle, help-circle, map-pin, type, calendar, message-circle), the section title, and the topic count (e.g., "6 topics")
- Clicking a card navigates to `/grammar/:sectionId`
- Use `useNavigate` from react-router-dom

Use the same card styling pattern from `Home.tsx`:
```
className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-6 text-left shadow-sm transition-shadow hover:shadow-md dark:border-slate-700 dark:bg-slate-800"
```

Icon wrapper:
```
className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500 dark:bg-indigo-500/10 dark:text-indigo-400"
```

For the icon SVGs, create a helper function or map that returns the appropriate SVG for each icon name. Use Heroicons (solid, 24x24 viewBox) to match the existing app style. Pick appropriate icons:
- book-open → BookOpenIcon
- user → UserIcon
- zap → BoltIcon
- clock → ClockIcon
- arrow-right → ArrowRightIcon
- layers → Square3Stack3DIcon
- palette → SwatchIcon
- gauge → ChartBarIcon (or similar)
- x-circle → XCircleIcon
- help-circle → QuestionMarkCircleIcon
- map-pin → MapPinIcon
- type → LanguageIcon (or Bars3BottomLeftIcon)
- calendar → CalendarIcon
- message-circle → ChatBubbleLeftIcon

**Step 2: Commit**

```bash
git add src/pages/GrammarIndex.tsx
git commit -m "feat: add grammar index page with section cards"
```

---

### Task 3: Create GrammarSection page

**Files:**
- Create: `src/pages/GrammarSection.tsx`

**Step 1: Create the page**

Create `src/pages/GrammarSection.tsx` that:
- Uses `PageLayout` and `Navigation` (title = section title)
- Gets `sectionId` from `useParams()`
- Finds the section in `grammarSections` by id
- If not found, shows a "Section not found" message with a link back to `/grammar`
- Renders each topic as a distinct group with the topic title as a heading
- Under each topic, renders each entry with:
  - The rule text (body text, normal weight)
  - Examples rendered as a list with French in a bold/indigo color and English in muted text
  - Tips rendered in a blue-tinted callout box (bg-blue-50 dark:bg-blue-900/20, with a lightbulb or info icon)
  - Warnings rendered in an amber-tinted callout box (bg-amber-50 dark:bg-amber-900/20)

Layout guidance:
- Topic title: `text-lg font-semibold` with bottom border or spacing
- Rules: normal text, `text-slate-700 dark:text-slate-300`
- French examples: `font-medium text-indigo-600 dark:text-indigo-400`
- English translations: `text-sm text-slate-500 dark:text-slate-400`
- Separate entries with spacing (e.g., `space-y-4` or `gap-4`)
- Separate topics with more spacing and a subtle divider

**Step 2: Commit**

```bash
git add src/pages/GrammarSection.tsx
git commit -m "feat: add grammar section detail page"
```

---

### Task 4: Add routes and Home screen card

**Files:**
- Modify: `src/App.tsx`
- Modify: `src/pages/Home.tsx`

**Step 1: Add routes to App.tsx**

In `src/App.tsx`:
- Import `GrammarIndex` and `GrammarSection` from `./pages/GrammarIndex` and `./pages/GrammarSection`
- Add two routes inside `<Routes>`:
  ```tsx
  <Route path="/grammar" element={<GrammarIndex />} />
  <Route path="/grammar/:sectionId" element={<GrammarSection />} />
  ```

**Step 2: Add card to Home.tsx**

In `src/pages/Home.tsx`, add a third card after the Listening Practice button, same style:
- Icon: a graduation-cap or academic-cap SVG (Heroicons `AcademicCapIcon` solid)
- Title: "Grammar Reference"
- Description: "Browse French grammar rules and examples"
- onClick: `navigate('/grammar')`

Use the same card pattern as the existing two cards.

**Step 3: Commit**

```bash
git add src/App.tsx src/pages/Home.tsx
git commit -m "feat: add grammar routes and home screen card"
```

---

### Task 5: Update versioning

**Files:**
- Modify: `src/lib/constants.ts` — bump `APP_VERSION` (e.g., '3.0.0' → '3.1.0')
- Modify: `version.json` — match new APP_VERSION

Check current values first and increment appropriately. Both must match.

Note: This is a Vite/React app so there's no `sw.js` to update in src — the PWA plugin handles caching. But `version.json` and `APP_VERSION` must be bumped.

**Step 1: Bump versions**

Update `APP_VERSION` in `src/lib/constants.ts` and `version` in `version.json` to the next minor version.

**Step 2: Commit**

```bash
git add src/lib/constants.ts version.json
git commit -m "chore: bump version for grammar reference feature"
```

---

### Task 6: Verify in browser

**Step 1: Start dev server and verify**

- Start the dev server with `npm run dev`
- Navigate to home page — verify third card appears
- Click "Grammar Reference" — verify index page with 14 section cards
- Click a section (e.g., "Nouns & Articles") — verify topics, rules, examples, tips render correctly
- Test dark mode toggle
- Test back navigation
- Test non-existent section URL shows error state
