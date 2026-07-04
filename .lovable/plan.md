## Scope
Medium upgrade across the 4 areas you picked. Frontend-only, uses existing APIs + localStorage (no backend schema changes).

## 1. Tafseer experience
- Add working **per-ayah audio tafseer** using MP3Quran's tafsir servers (Al-Shaarawi, Al-Saadi, Al-Sha3rawi) — real inline `<audio>` player instead of YouTube redirects (kept as fallback).
- Add **bookmark ayah** button (heart icon) — saved in localStorage, viewable in a new "المحفوظات" tab.
- **Share ayah** button (Web Share API + copy-to-clipboard fallback) — copies verse text + reference.
- Font size slider inside tafseer dialog (persisted).

## 2. Voice practice
- **Per-word live feedback**: correctly said words turn green with a checkmark tick, wrong words shake + red highlight + beep.
- **Hint button**: reveals next expected word for 2s.
- **Session stats**: accuracy %, words correct/total, best streak — shown after each verse.
- **Auto-advance toggle**: when 100% correct, auto-move to next ayah after 1.5s.

## 3. Reading experience
- **Verse repeat/loop**: repeat current ayah N times (1/3/5/∞) before advancing — useful for memorization.
- **Focus mode**: dim everything except current verse; toggle in side panel.
- **Night reading preset**: one-click warm sepia palette + reduced brightness.

## 4. Gamification & progress
- **Daily streak counter** (localStorage): increments once per day a verse is read/practiced; resets after a missed day. Shown as a flame chip in header.
- **Daily goal**: set target ayahs/day (default 10) with progress ring.
- **Achievements**: 5 simple badges (first verse, 7-day streak, 30-day streak, 100 verses, finished a surah) with toast on unlock.
- **Stats panel** in existing "الإحصائيات" area: total verses read, total practice sessions, best streak, achievements grid.

## Technical notes
- All state in `localStorage` keys under `quran_*` namespace (matches existing pattern). For signed-in users we can sync later — out of scope for this pass.
- Audio tafseer uses `https://server{N}.mp3quran.net/{reciter}/{surah:03}.mp3` (surah-level, seeks not per-ayah — clearly labeled as "تفسير السورة كاملة").
- Achievements + streak logic in a new `src/lib/gamification.ts` module with a `useGamification` hook.
- Bookmarks in `src/lib/bookmarks.ts` + new tab in `Index.tsx`.
- Focus mode + repeat loop wired through `VerseCard.tsx` props from `Index.tsx`.

## Files touched
- `src/components/VerseCard.tsx` — audio tafseer, bookmark, share, repeat loop, focus mode
- `src/components/PracticeMode.tsx` — per-word feedback, hint, session stats, auto-advance
- `src/pages/Index.tsx` — new tab, streak chip, daily goal ring, focus/repeat controls
- `src/components/QuranStats.tsx` — achievements grid + streak/goal display
- new: `src/lib/gamification.ts`, `src/lib/bookmarks.ts`, `src/components/BookmarksList.tsx`, `src/components/AchievementToast.tsx`

Approve and I'll implement.