# GTA 6 Guide

Fan-made GTA 6 guide with a 100% tracker. Live at https://trackgta6.com. Cloudflare builds it on every push to `main` by running `node build.mjs` (no packages needed) and deploys the `dist` folder.

## Where things live

| File or folder | What it is | Edit it when |
|---|---|---|
| `data.json` | Tracker items (collectibles, missables, trophies) | Every launch-night publish: download from `/edit` and replace |
| `content/*.json` | Wiki pages: characters, places, radio, gameplay, editions, launch, FAQ | Rockstar reveals something new, or you confirm something in-game |
| `src/tracker.html` | The tracker page (`/tracker/`, and `/edit` behind a password) | Changing the tracker itself |
| `src/countdown.html` | The country-by-country countdown (`/countdown/`) | Rarely |
| `src/assets/` | Shared styles and favicon | Changing the look |
| `src/assets/img/` | Official photos for characters and places (see IMAGES.md) | Adding photos |
| `build.mjs` | Turns the content into pages | Adding a new kind of page |
| `worker.js` | `/edit`: password check, publishing, AI drafts | Changing the editor |

## Rules
- Write descriptions in your own words and keep a source link for every fact.
- Never change a published tracker item ID.
- To preview locally: `node build.mjs`, then serve the `dist` folder (e.g. `npx serve dist`).

## Hosting on Cloudflare (Workers)

The site runs on Cloudflare Workers. Static pages are served free and unlimited; the small
`worker.js` only runs for `/edit` to check the password.

- Config: `wrangler.jsonc` (serves `./dist`, runs the worker first for `/edit`).
- Build command: `node build.mjs` · Deploy command: `npx wrangler deploy`.
- Secrets: `EDIT_PASSWORD` and `GITHUB_TOKEN` (Settings → Variables and Secrets → type Secret).
- Analytics: create a site in Cloudflare Web Analytics, then add a build variable
  `CF_ANALYTICS_TOKEN` with its token.
- Redirects live in `dist/_redirects`, cache headers in `dist/_headers` (both written by the build).
