# ContactFusion — Light Dashboard UI Update

Replaces the previous dark "fusion" theme with a light SaaS-style dashboard
(blue/green/purple/red accent cards, top brand bar, colorful upload buttons,
bottom tab bar on mobile) matching the reference mockup.

## Files to overwrite
```
ContactFusion/
├── templates/index.html
└── static/
    ├── script.js
    └── css/{style.css, animations.css, responsive.css}
```

Same drop-in rule as before: overwrite these exact paths, restart uvicorn, hard-refresh.
No Python/backend files changed in this update — it builds on top of the
multi-part download fix from the previous package, so apply that first if you
haven't already.

## What's new vs. the previous (dark) version
- Light theme by default, with a toggle switch (top-right) to flip to dark
- Top full-width header bar with logo, product name, version badge, tagline
- Left sidebar (desktop): nav list, a "Need Help" card, and a "Selected Batch"
  summary card that reflects your currently selected files (count + size) —
  no fabricated storage-quota numbers, just real session data
- 4 colored stat cards (Files / Rows / Unique / Duplicate) instead of 6
- 3 colorful upload action buttons (blue/green/purple) matching the mockup
- Processing panel redesigned: title+percentage header, thin progress bar,
  a Current File / Elapsed / Remaining / Speed / Files meta row, and
  Start / Pause / Stop buttons (Pause and Stop are disabled placeholders —
  same as before, since the backend doesn't support pausing/stopping yet)
- Console restyled to match (icon-per-line instead of text badges)
- On mobile: sidebar is replaced by a fixed bottom tab bar (Dashboard / Files
  / History / Settings), matching the phone mockup, instead of the previous
  slide-out drawer
- Feature strip at the bottom (5 marketing tiles) — cosmetic only

## Still true from before
- All endpoints unchanged: /upload /start /progress /download
- All functional element IDs preserved: status, currentFile, processedFiles,
  rows, unique, duplicates, elapsed, progressBar, logs, downloadBtn (now a
  container that can hold multiple download links), uploadBtn, fileList,
  chooseBtn, folderBtn, zipBtn, fileInput, folderInput, zipInput
- Multi-part output downloads (Part 1 of 2, etc.) still work
