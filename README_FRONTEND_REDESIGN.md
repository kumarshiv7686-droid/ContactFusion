# ContactFusion v2.0 — Frontend Redesign

Drop these files into your project, overwriting the matching paths. **No Python files are touched.**

```
ContactFusion/
├── templates/
│   └── index.html          ← replace
└── static/
    ├── script.js            ← replace (same filename — keeps your cache-busting logic in main.py working)
    └── css/
        ├── style.css        ← new
        ├── animations.css   ← new
        └── responsive.css   ← new
```

Your old `static/style.css` is no longer used — you can delete it (or leave it, nothing references it anymore).

## Why `script.js` kept its name and path
`app/main.py` computes a cache-busting version number from `static/script.js`'s modification time:
```python
script_path = os.path.join("static", "script.js")
script_version = int(os.path.getmtime(script_path)) ...
```
Renaming it to `static/js/app.js` (as the plan's file-structure section suggested) would've required a backend edit, which the brief said to avoid. So the new script lives at the same path — just rewritten.

## What didn't change
- All endpoints: `/upload`, `/start`, `/progress`, `/download`.
- All element IDs your polling logic (and backend expectations) rely on: `status`, `currentFile`, `processedFiles`, `rows`, `unique`, `duplicates`, `elapsed`, `progressBar`, `logs`, `downloadBtn`, `uploadBtn`, `fileList`, `chooseBtn`, `folderBtn`, `zipBtn`, `fileInput`, `folderInput`, `zipInput`.
- The `/progress` JSON shape your backend already returns.

## What's new
- **Layout**: collapsible sidebar, top bar with live status pill, dashboard card grid, upload workspace, processing panel, terminal-style console, footer.
- **6 dashboard cards**: Total Rows, Unique Contacts, Duplicate Contacts, Files Processed, Processing Speed, Est. Time Remaining. The last two are computed client-side from `rows_processed`/`elapsed` and `processed_files`/`total_files` — no backend change needed.
- **Upload**: drag & drop, Add Files / Add Folder / Import ZIP, removable file chips with icons and sizes, inline validation against `.xlsx .xlsm .xls .xlsb .csv .zip`.
- **Processing panel**: animated progress bar, current file, live counters, Pause/Resume buttons (disabled placeholders — wire these up once/if the backend supports pausing).
- **Console**: timestamped, color-coded (success/warning/error/info) log lines, auto-scroll toggle, copy button, clear button (clears the view only; your backend's log history is untouched).
- **Themes**: dark (default) and light, toggle in the top bar, persisted via `localStorage`.
- **Responsive**: sidebar collapses to an icon rail on desktop and slides in as an overlay on tablet/mobile; card grid reflows 6 → 3 → 2 columns; no horizontal scroll at any width.
- **Toast notifications** for upload errors, start/complete/fail events.

## One thing to sanity-check
Client-side extension validation assumes `.xlsx .xlsm .xls .xlsb .csv .zip` are the only supported types, based on `SUPPORTED_EXTENSIONS` in `core/consolidator.py` plus `.zip` handling in `core/processor.py`. If that list changes on the backend, update `SUPPORTED_EXTENSIONS` at the top of `static/script.js` to match.
