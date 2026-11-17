# GTA 6 Guide

Fan-made GTA 6 guide with a 100% tracker. Vercel builds it on every commit by running `node build.mjs` (no packages needed) and publishes the `dist` folder.

## Where things live

| File or folder | What it is | Edit it when |
|---|---|---|
| `data.json` | Tracker items (collectibles, missables, trophies) | Every launch-night publish: download from `/edit` and replace |
| `content/*.json` | Wiki pages: characters, places, radio, gameplay, editions, launch, FAQ | Rockstar reveals something new, or you confirm something in-game |
| `src/tracker.html` | The tracker page (`/tracker/`, and `/edit` behind a password) | Changing the tracker itself |
| `src/countdown.html` | The country-by-country countdown (`/countdown/`) | Rarely |
| `src/assets/` | Shared styles and favicon | Changing the look |
| `build.mjs` | Turns the content into pages | Adding a new kind of page |
| `middleware.js` | Password check for `/edit` (needs `EDIT_PASSWORD` in Vercel) | Rarely |

## Rules
- Write descriptions in your own words and keep a source link for every fact.
- Never change a published tracker item ID.
- To preview locally: `node build.mjs`, then serve the `dist` folder (e.g. `npx serve dist`).
