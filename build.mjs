// Builds the GTA 6 Guide into ./dist. No dependencies: run `node build.mjs`.
// Cloudflare runs this automatically on every push to main (see wrangler.jsonc).
// Edit the content in ./content/*.json and the tracker data in ./data.json.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const SITE = (process.env.SITE_URL || "https://trackgta6.com").replace(/\/$/, "");
const SITE_NAME = "GTA 6 Guide";

const read = (f) => JSON.parse(fs.readFileSync(path.join(ROOT, f), "utf8"));
const C = {
  characters: read("content/characters.json"),
  places: read("content/places.json"),
  radio: read("content/radio.json"),
  features: read("content/features.json"),
  editions: read("content/editions.json"),
  launch: read("content/launch.json"),
  faq: read("content/faq.json"),
  videos: read("content/videos.json"),
};
const VIDEOS = C.videos.items.filter((v) => v.youtube);
const charById = Object.fromEntries(C.characters.items.map((c) => [c.id, c]));
const placeById = Object.fromEntries(C.places.items.map((p) => [p.id, p]));

const esc = (s) => String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const fmtDate = (iso) => new Date(iso + "T12:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
const pages = [];
// Visitor analytics: Cloudflare Web Analytics when CF_ANALYTICS_TOKEN is set at build time.
const ANALYTICS = process.env.CF_ANALYTICS_TOKEN
  ? `<script defer src="https://static.cloudflareinsights.com/beacon.min.js" data-cf-beacon='${JSON.stringify({ token: process.env.CF_ANALYTICS_TOKEN })}'></script>`
  : "";
const SITE_CSS = fs.readFileSync(path.join(ROOT, "src/assets/site.css"), "utf8").replace(/\/\*[\s\S]*?\*\//g, "").replace(/\s*\n\s*/g, "\n");

function write(rel, html) {
  const file = path.join(OUT, rel);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, html);
}
function copyDir(from, to) {
  fs.mkdirSync(to, { recursive: true });
  for (const e of fs.readdirSync(from, { withFileTypes: true })) {
    const a = path.join(from, e.name), b = path.join(to, e.name);
    e.isDirectory() ? copyDir(a, b) : fs.copyFileSync(a, b);
  }
}

/* ======================= original artwork ======================= */
const ICON = {
  tracker: '<svg viewBox="0 0 52 52" class="ic" aria-hidden="true"><rect x="6" y="6" width="40" height="40" rx="9" fill="#f7f4ee"/><path d="M15 20l4 4 8-8M15 33l4 4 8-8" fill="none" stroke="#0e6b41" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/><rect x="31" y="18" width="9" height="4" rx="2" fill="#0e6b41"/><rect x="31" y="31" width="9" height="4" rx="2" fill="#0e6b41"/></svg>',
  clock: '<svg viewBox="0 0 52 52" class="ic" aria-hidden="true"><circle cx="26" cy="26" r="21" fill="#f7f4ee"/><path d="M26 14v13l9 5" fill="none" stroke="#7a2c5c" stroke-width="4" stroke-linecap="round"/></svg>',
  tag: '<svg viewBox="0 0 52 52" class="ic" aria-hidden="true"><path d="M8 26V9h17l19 19-17 17z" fill="#f7f4ee"/><circle cx="17" cy="18" r="4" fill="#a8532a"/></svg>',
  story: '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#d6457a"/><circle cx="20" cy="21" r="6" fill="#f7f4ee"/><circle cx="33" cy="21" r="6" fill="#f7f4ee"/><path d="M10 40c2-7 6-10 10-10s8 3 10 10M24 40c2-7 5-10 9-10s7 3 9 10" fill="#f7f4ee"/></svg>',
  combat: '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#0e6b41"/><path d="M26 10l3.8 7.8 8.6 1.2-6.2 6 1.5 8.5L26 29.4l-7.7 4.1 1.5-8.5-6.2-6 8.6-1.2z" fill="#f7c318"/><rect x="14" y="37" width="24" height="4" rx="2" fill="#f7f4ee"/></svg>',
  activities: '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#2a8fb8"/><path d="M17 40V12" stroke="#f7f4ee" stroke-width="3" stroke-linecap="round"/><path d="M18 13h18l-4 6 4 6H18z" fill="#f7f4ee"/><rect x="18" y="13" width="6" height="4" fill="#1b1d24"/><rect x="30" y="13" width="4" height="4" fill="#1b1d24"/><rect x="24" y="17" width="6" height="4" fill="#1b1d24"/><rect x="18" y="21" width="6" height="4" fill="#1b1d24"/></svg>',
  phone: '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#7b4bd1"/><rect x="17" y="10" width="18" height="32" rx="4" fill="#f7f4ee"/><rect x="20" y="15" width="12" height="18" rx="1.5" fill="#7b4bd1"/><path d="M23 27l3-6 3 6" stroke="#f7c318" stroke-width="2" fill="none"/></svg>',
  money: '<svg viewBox="0 0 52 52" aria-hidden="true"><circle cx="26" cy="26" r="24" fill="#f28c28"/><rect x="11" y="17" width="30" height="18" rx="3" fill="#f7f4ee"/><circle cx="26" cy="26" r="5" fill="#f28c28"/></svg>',
};

/* ---------- photos: drop files into src/assets/img/<kind>/ named by id ----------
   e.g. src/assets/img/characters/jason-duval.jpg, extra shots jason-duval-2.jpg, -3.jpg …
   Supported: .jpg .jpeg .webp .png. Anything not found falls back to original artwork. */
const IMG_EXT = /\.(jpe?g|webp|png)$/i;
function photos(kind, id) {
  const dir = path.join(ROOT, "src/assets/img", kind);
  if (!fs.existsSync(dir)) return [];
  const re = new RegExp("^" + id.replace(/[-]/g, "\\-") + "(-(\\d+))?\\.(jpe?g|webp|png)$", "i");
  return fs.readdirSync(dir).filter((f) => re.test(f))
    .sort((a, b) => (+(a.match(re)[2] || 1)) - (+(b.match(re)[2] || 1)))
    .map((f) => `/assets/img/${kind}/${f}`);
}
function photo(kind, id, fallback, alt, { eager = false, index = 0, focus = "" } = {}) {
  const src = photos(kind, id)[index];
  if (!src) return `<div class="ph">${fallback}</div>`;
  return `<div class="ph"><img src="${src}" alt="${esc(alt)}"${focus ? ` style="object-position:${esc(focus)}"` : ""} ${eager ? 'fetchpriority="high"' : 'loading="lazy"'} decoding="async"><span class="credit">Image: Rockstar Games</span></div>`;
}
function poster(c) {
  const palettes = { "Leads": ["#3b1f5c", "#f06a5f", "#ffb35c"], "Jason's circle": ["#0d3b4f", "#1f8f8a", "#bfe6c9"], "Only Raw Records": ["#2a1240", "#7b4bd1", "#ff7ab8"], "Heists": ["#3a1a12", "#d9572b", "#ffd27a"] };
  const [a, b, s] = palettes[c.group] || ["#1b1d24", "#4b5266", "#a3a9b8"];
  const initials = c.name.split(/\s+/).map((w) => w[0]).join("").replace(/[^A-Z]/g, "").slice(0, 2);
  const g = "po-" + c.id;
  return `<div class="poster"><svg viewBox="0 0 400 500" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs><linearGradient id="${g}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".7" stop-color="${b}"/><stop offset="1" stop-color="${s}"/></linearGradient><mask id="${g}m"><rect width="400" height="500" fill="#fff"/><g fill="#000"><rect y="250" width="400" height="5"/><rect y="266" width="400" height="7"/><rect y="285" width="400" height="9"/></g></mask></defs>`+
    `<rect width="400" height="500" fill="url(#${g})"/><circle cx="270" cy="250" r="110" fill="${s}" opacity=".85" mask="url(#${g}m)"/>`+
    `<text x="-8" y="250" font-family="Big Shoulders Display,Impact,sans-serif" font-weight="900" font-size="260" fill="#fff" opacity=".13">${esc(initials)}</text>`+
    `<path d="M120 500c0-70 30-118 80-130-28-14-44-40-44-72 0-44 32-78 74-78s74 34 74 78c0 32-16 58-44 72 50 12 80 60 80 130z" fill="#0e0a1c" opacity=".78"/>`+
    `<path d="M352 500c2-60 6-110-2-170" stroke="#0e0a1c" stroke-width="9" fill="none"/><g fill="#0e0a1c"><path d="M350 330c-18-20-44-20-58 0 18-10 38-10 58 4zM350 330c-6-24 4-44 20-52-10 14-14 30-16 52zM350 330c14-20 40-22 56-6-18-6-36-4-54 10z"/></g></svg></div>`;
}

function avatar(c) {
  const palettes = { "Leads": ["#ff7a59", "#d6457a"], "Jason's circle": ["#2a8fb8", "#0e6b41"], "Only Raw Records": ["#7b4bd1", "#d6457a"], "Heists": ["#f7c318", "#f28c28"] };
  const [a, b] = palettes[c.group] || ["#4b5266", "#323848"];
  const initials = c.name.split(/\s+/).map((w) => w[0]).join("").replace(/[^A-Z]/g, "").slice(0, 2);
  const g = "av-" + c.id;
  return `<svg viewBox="0 0 120 120" class="av" role="img" aria-label="${esc(c.name)}"><defs><linearGradient id="${g}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs>`+
    `<circle cx="60" cy="60" r="58" fill="url(#${g})"/><circle cx="60" cy="60" r="50" fill="none" stroke="#f7f4ee" stroke-opacity=".55" stroke-width="2"/>`+
    `<path d="M60 92c-17 0-28 7-33 16a58 58 0 0 0 66 0c-5-9-16-16-33-16z" fill="#14112a" opacity=".35"/>`+
    `<text x="60" y="72" text-anchor="middle" font-family="Overpass,Arial Narrow,sans-serif" font-weight="900" font-size="40" fill="#f7f4ee">${esc(initials)}</text></svg>`;
}

function art(name, k) {
  const g = "pc" + k;
  const P = {
    "Vice City": `<defs><linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3b1f5c"/><stop offset=".6" stop-color="#e05a6c"/><stop offset="1" stop-color="#ffb35c"/></linearGradient></defs><rect width="300" height="180" fill="url(#${g}s)"/><circle cx="200" cy="112" r="44" fill="#ffd27a"/><path d="M0 132V96h16V84h14v18h18V60h10V48h10v12h8v50h18V88h22v44h16V74h12v58Z" fill="#2c1740"/><rect y="128" width="300" height="52" fill="#25183d"/><g fill="#ffb35c" opacity=".6"><rect x="168" y="138" width="64" height="3" rx="1.5"/><rect x="178" y="148" width="44" height="3" rx="1.5"/></g><path d="M262 180c1-30 3-54 0-80" stroke="#100a1c" stroke-width="5" fill="none"/><g fill="#100a1c"><path d="M262 100c-10-12-26-12-34 0 10-6 22-6 34 2zM262 100c-4-14 2-26 12-30-6 8-8 18-10 30zM262 100c8-12 24-14 34-4-10-4-22-2-32 6zM262 100c-12 2-20 12-22 24 6-10 14-16 22-20z"/></g>`,
    "Leonida Keys": `<defs><linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6ec6e6"/><stop offset="1" stop-color="#ffd9a8"/></linearGradient><linearGradient id="${g}w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2fc2c2"/><stop offset="1" stop-color="#0d6f8f"/></linearGradient></defs><rect width="300" height="180" fill="url(#${g}s)"/><circle cx="64" cy="54" r="22" fill="#fff4c9"/><rect y="104" width="300" height="76" fill="url(#${g}w)"/><path d="M0 98h300v7H0z" fill="#e9e3d6"/><g fill="#e9e3d6"><path d="M8 105h8v18H8zM58 105h8v18h-8zM108 105h8v18h-8zM158 105h8v18h-8zM208 105h8v18h-8zM258 105h8v18h-8z"/></g><ellipse cx="236" cy="146" rx="46" ry="9" fill="#f2dfae"/><path d="M236 146c0-14 2-24-2-34" stroke="#1f3b2f" stroke-width="3" fill="none"/><path d="M234 112c-8-6-18-4-22 4 6-4 14-4 22 0zM234 112c6-8 18-8 24 0-8-3-16-2-24 2zM234 112c-2-8 4-14 10-16-4 5-6 10-8 16z" fill="#1f3b2f"/><g fill="#fff" opacity=".6"><rect x="30" y="140" width="40" height="2" rx="1"/><rect x="110" y="156" width="56" height="2" rx="1"/></g>`,
    "Grassrivers": `<defs><linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1f4a4f"/><stop offset="1" stop-color="#d9a35a"/></linearGradient></defs><rect width="300" height="180" fill="url(#${g}s)"/><g fill="#14302c"><path d="M40 120c0-30 4-60 2-80M42 60c-14 6-22 18-24 30M42 70c12 4 20 14 22 26" stroke="#14302c" stroke-width="5" fill="none"/><path d="M220 124V44l-16 34h32zM220 64l-20 40h40z"/><path d="M268 124V70l-10 22h20zM268 84l-14 30h28z"/></g><rect y="120" width="300" height="60" fill="#163a33"/><g fill="#d9a35a" opacity=".35"><rect x="20" y="134" width="70" height="2"/><rect x="150" y="150" width="90" height="2"/></g><g stroke="#2c5a3a" stroke-width="3" stroke-linecap="round"><path d="M10 180l6-40M22 180l2-46M34 180l8-38M260 180l-4-44M272 180l2-36M284 180l6-42M296 180l-2-30"/></g><g fill="#0f2621"><ellipse cx="140" cy="140" rx="26" ry="4"/><circle cx="128" cy="136" r="4"/><circle cx="140" cy="136" r="4"/></g><g fill="#f7c318"><circle cx="128" cy="135" r="1.6"/><circle cx="140" cy="135" r="1.6"/></g>`,
    "Port Gellhorn": `<defs><linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#506a8c"/><stop offset="1" stop-color="#e8b08a"/></linearGradient></defs><rect width="300" height="180" fill="url(#${g}s)"/><g fill="#2d2a3a"><rect x="30" y="80" width="70" height="46"/><rect x="36" y="70" width="58" height="12" fill="#d6457a"/></g><g fill="#ffd27a" opacity=".5"><rect x="38" y="90" width="10" height="8"/><rect x="56" y="90" width="10" height="8"/><rect x="74" y="104" width="10" height="8"/></g><g stroke="#1e2433" stroke-width="5" fill="none"><path d="M180 128V48h64M204 48v18M180 62l24-14"/></g><g><rect x="214" y="104" width="34" height="14" fill="#0e6b41"/><rect x="214" y="118" width="34" height="10" fill="#f7c318"/><rect x="248" y="110" width="34" height="18" fill="#7b4bd1"/></g><rect y="126" width="300" height="54" fill="#27344a"/><rect y="124" width="300" height="5" fill="#1e2433"/><g fill="#e8b08a" opacity=".45"><rect x="40" y="144" width="60" height="2"/><rect x="170" y="160" width="80" height="2"/></g>`,
    "Ambrosia": `<defs><linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6b25a"/><stop offset="1" stop-color="#fbe2a6"/></linearGradient></defs><rect width="300" height="180" fill="url(#${g}s)"/><circle cx="240" cy="58" r="20" fill="#fff1c4"/><g fill="#6b3b2a"><rect x="46" y="56" width="14" height="66"/><rect x="66" y="40" width="12" height="82"/><rect x="84" y="78" width="54" height="44"/><path d="M84 78l14-12 14 12 14-12 12 12z"/></g><g fill="#e9dccb" opacity=".8"><circle cx="72" cy="32" r="8"/><circle cx="82" cy="22" r="10"/><circle cx="96" cy="14" r="8"/></g><g fill="#c9d6d8"><rect x="168" y="70" width="18" height="52" rx="8"/><rect x="190" y="78" width="18" height="44" rx="8"/></g><rect y="120" width="300" height="60" fill="#8fa24a"/><g stroke="#6f8436" stroke-width="3"><path d="M0 132h300M0 146h300M0 162h300"/></g><path d="M130 180l20-60h10l30 60z" fill="#6b5a44"/>`,
    "Mount Kalaga National Park": `<defs><linearGradient id="${g}s" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#9fd0c8"/><stop offset="1" stop-color="#f4e3c4"/></linearGradient></defs><rect width="300" height="180" fill="url(#${g}s)"/><path d="M0 120L70 50l40 34 50-56 70 70 70-30v112H0z" fill="#5f8f7a"/><path d="M150 28l18 20-8-2-10 10-6-8-8 4z" fill="#f7f4ee"/><path d="M0 140l60-30 60 22 70-36 110 40v44H0z" fill="#3f6b55"/><g fill="#244536"><path d="M30 160l10-28 10 28zM50 166l12-34 12 34zM210 160l10-28 10 28zM232 168l12-36 12 36zM256 166l10-28 10 28z"/></g><rect y="164" width="300" height="16" fill="#244536"/><g fill="#fff" opacity=".35"><rect x="80" y="104" width="120" height="6" rx="3"/></g>`,
  };
  return `<svg viewBox="0 0 300 180" preserveAspectRatio="xMidYMid slice" aria-hidden="true">${P[name] || ""}</svg>`;
}

const HERO = `<svg class="scene" viewBox="0 0 1200 600" preserveAspectRatio="xMidYMax slice" aria-hidden="true"><defs><linearGradient id="hSky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#121236"/><stop offset=".38" stop-color="#3b1f5c"/><stop offset=".62" stop-color="#a23a6e"/><stop offset=".8" stop-color="#f06a5f"/><stop offset="1" stop-color="#ffb35c"/></linearGradient><linearGradient id="hSun" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffec8a"/><stop offset=".6" stop-color="#ffa45c"/><stop offset="1" stop-color="#ff5f6d"/></linearGradient><linearGradient id="hSea" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#5a2a62"/><stop offset=".5" stop-color="#25183d"/><stop offset="1" stop-color="#121022"/></linearGradient><mask id="hSunMask"><rect width="1200" height="600" fill="#fff"/><g fill="#000"><rect y="352" width="1200" height="4"/><rect y="366" width="1200" height="6"/><rect y="382" width="1200" height="8"/><rect y="400" width="1200" height="10"/></g></mask><pattern id="hWin" width="12" height="16" patternUnits="userSpaceOnUse"><rect x="3" y="4" width="4" height="5" fill="#ffd27a"/></pattern><symbol id="palm" viewBox="0 0 160 360"><path d="M84 360 C86 270 92 190 82 96" stroke="#100a1c" stroke-width="11" fill="none" stroke-linecap="round"/><g fill="#100a1c"><path d="M82 96 C56 70 22 70 0 100 C26 84 56 86 82 102Z"/><path d="M82 96 C64 56 34 40 10 46 C40 52 64 70 80 102Z"/><path d="M82 96 C92 52 120 30 150 34 C122 46 100 66 86 102Z"/><path d="M82 96 C112 76 144 82 160 112 C136 96 110 94 84 104Z"/><path d="M82 96 C78 64 88 34 104 18 C96 46 92 70 86 100Z"/><path d="M82 96 C60 104 40 128 36 156 C52 132 66 116 84 106Z"/><path d="M82 96 C104 106 122 128 124 152 C110 132 98 118 82 106Z"/></g></symbol></defs><rect width="1200" height="600" fill="url(#hSky)"/><g fill="#fff" opacity=".7"><circle cx="90" cy="60" r="1.6"/><circle cx="260" cy="110" r="1.2"/><circle cx="430" cy="48" r="1.4"/><circle cx="610" cy="92" r="1"/><circle cx="980" cy="70" r="1.5"/><circle cx="1110" cy="130" r="1.1"/><circle cx="760" cy="40" r="1.3"/></g><g class="sun"><circle cx="840" cy="350" r="150" fill="url(#hSun)" mask="url(#hSunMask)"/></g><path d="M0 430 V360 H34 V338 H60 V372 H96 V300 H112 V276 H128 V300 H146 V380 H184 V340 H232 V236 H246 V210 H262 V236 H274 V352 H312 V318 H350 V384 H392 V282 H420 V300 H452 V364 H486 V330 H520 V400 H560 V430 Z" fill="#2c1740"/><path d="M0 430 V360 H34 V338 H60 V372 H96 V300 H112 V276 H128 V300 H146 V380 H184 V340 H232 V236 H246 V210 H262 V236 H274 V352 H312 V318 H350 V384 H392 V282 H420 V300 H452 V364 H486 V330 H520 V400 H560 V430 Z" fill="url(#hWin)" opacity=".35"/><path d="M0 440 V392 H48 V364 H88 V410 H140 V350 H172 V402 H214 V372 H262 V420 H300 V388 H338 V440 Z" fill="#1d0f2e"/><path d="M0 440 V392 H48 V364 H88 V410 H140 V350 H172 V402 H214 V372 H262 V420 H300 V388 H338 V440 Z" fill="url(#hWin)" opacity=".22"/><rect y="428" width="1200" height="172" fill="url(#hSea)"/><g fill="#ffb35c" opacity=".55"><rect x="740" y="438" width="200" height="4" rx="2"/><rect x="760" y="452" width="160" height="4" rx="2"/><rect x="782" y="468" width="116" height="4" rx="2"/><rect x="800" y="486" width="80" height="4" rx="2"/><rect x="814" y="506" width="52" height="3" rx="1.5"/></g><path d="M560 432 H1200 V440 H560Z" fill="#1a0f29"/><g fill="#1a0f29"><rect x="600" y="440" width="6" height="16"/><rect x="700" y="440" width="6" height="16"/><rect x="800" y="440" width="6" height="16"/><rect x="900" y="440" width="6" height="16"/><rect x="1000" y="440" width="6" height="16"/><rect x="1100" y="440" width="6" height="16"/></g><path d="M0 600 V470 C160 452 300 448 420 456 L560 600 Z" fill="#120c1f"/><path d="M330 600 L560 448 L600 448 L760 600 Z" fill="#1a1824"/><g stroke="#f7c318" stroke-width="4" stroke-linecap="round" opacity=".85"><line x1="576" y1="458" x2="575" y2="466"/><line x1="572" y1="482" x2="570" y2="496"/><line x1="566" y1="520" x2="563" y2="540"/><line x1="558" y1="570" x2="554" y2="598"/></g><use href="#palm" x="-10" y="170" width="190" height="430"/><use href="#palm" x="120" y="250" width="140" height="350"/><use href="#palm" x="1040" y="180" width="180" height="420" transform="translate(2260 0) scale(-1 1)"/></svg>`;

/* ======================= layout ======================= */
const NAV = [
  ["/tracker/", "100% Tracker"], ["/launch/", "Launch"], ["/editions/", "Editions"], ["/videos/", "Videos"],
  ["/characters/", "Characters"], ["/places/", "Places"], ["/features/", "Gameplay"], ["/radio/", "Radio"], ["/faq/", "FAQ"],
];

// Search engines show about 155 characters of a description: add the tail only if it fits.
const fitDesc = (main, tail) => (main + " " + tail).length <= 155 ? main + " " + tail : main;

// Page backdrop: a tiny pre-blurred copy of the page's own photo (src/assets/img/bg/<kind>-<id>.jpg).
function bgFor(image, bg) {
  if (bg) return `/assets/img/bg/${bg}.jpg`;
  const m = /^\/assets\/img\/(characters|places)\/([a-z0-9-]+?)(-\d+)?\.jpe?g$/i.exec(image || "");
  const f = m && `${m[1]}-${m[2]}`;
  return f && fs.existsSync(path.join(ROOT, "src/assets/img/bg", f + ".jpg")) ? `/assets/img/bg/${f}.jpg` : "/assets/img/bg/places-vice-city.jpg";
}

const TRACKER_APP_LD = {
  "@context": "https://schema.org", "@type": "WebApplication", name: "GTA 6 100% Completion Tracker",
  url: SITE + "/tracker/", applicationCategory: "GameApplication", operatingSystem: "Any (web browser)",
  isAccessibleForFree: true, offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  description: "Free checklist for Grand Theft Auto VI: missables, collectibles, side activities and trophies, filtered by region, with progress saved on your device.",
};

function layout({ url, title, description, body, jsonld, script, image, bg }) {
  pages.push(url);
  const full = url === "/" ? `GTA 6 Guide & 100% Tracker: release times, prices, characters, map` : `${title} | ${SITE_NAME}`;
  const img = SITE + (image || "/assets/og.jpg");
  if (description.length > 155) description = description.slice(0, 154).replace(/\s+\S*$/, "").replace(/[,:;]$/, "") + "…";
  const lds = (Array.isArray(jsonld) ? jsonld : jsonld ? [jsonld] : []);
  const nav = NAV.filter(([h]) => h !== "/tracker/").map(([h, l]) => `<a href="${h}"${h === url || (h !== "/" && url.startsWith(h)) ? ' aria-current="page"' : ""}${h === "/tracker/" ? ' class="cta"' : ""}>${l}</a>`).join("");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${esc(full)}</title>
<meta name="description" content="${esc(description)}">
<link rel="canonical" href="${SITE}${url}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="${SITE_NAME}">
<meta property="og:title" content="${esc(full)}">
<meta property="og:description" content="${esc(description)}">
<meta property="og:url" content="${SITE}${url}">
<meta property="og:image" content="${img}">${image ? "" : `\n<meta property="og:image:width" content="1200"><meta property="og:image:height" content="630">`}
<meta property="og:image:alt" content="${esc(full)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(full)}">
<meta name="twitter:description" content="${esc(description)}">
<meta name="twitter:image" content="${img}">
<meta name="theme-color" content="#141433">
<meta name="color-scheme" content="dark">
<style>html{background:#1b1d24;color-scheme:dark}</style>
${HEAD_FX}
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/assets/apple-touch-icon.png">
<link rel="manifest" href="/manifest.webmanifest">
${ANALYTICS}
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>${SITE_CSS}</style>
<script defer src="/assets/region.js"></script>
${lds.map((j) => `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`).join("\n")}
</head>
<body style="--bg:url('${bgFor(image, bg)}')">
<header class="bar"><div class="wrap"><a class="logo" href="/" aria-label="${SITE_NAME} home">${LOGO_MARK}<span><b>GTA 6 Guide</b><small>Leonida field guide</small></span></a><nav class="nav" aria-label="Main">${nav}</nav><a class="hcta${url === "/tracker/" ? " on" : ""}" href="/tracker/"><svg viewBox="0 0 20 20" aria-hidden="true"><path d="M4 10.5l3.5 3.5L16 5.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/></svg>100% Tracker</a></div></header>
${body}
<footer class="site"><div class="wrap">
  <div class="cols"><nav aria-label="Footer"><a href="/">Home</a>${NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}<a href="/about/">About</a></nav></div>
  <p>Fan-made and unofficial. Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive. Grand Theft Auto and related names are trademarks of their owners. Screenshots are official Rockstar Games images, credited where shown. <a href="/faq/#sources">Where our facts come from</a>.</p>
</div></footer>
<script>${LB_SCRIPT}${script || ""}</script>
</body>
</html>`;
}


const LOGO_MARK = `<svg class="mark" viewBox="0 0 40 40" aria-hidden="true"><defs><linearGradient id="lgS" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe27a"/><stop offset=".55" stop-color="#ff8a5b"/><stop offset="1" stop-color="#e2457a"/></linearGradient><clipPath id="lgC"><rect width="40" height="40" rx="11"/></clipPath></defs><g clip-path="url(#lgC)"><rect width="40" height="40" fill="#1a1238"/><circle cx="20" cy="25" r="12" fill="url(#lgS)"/><g fill="#1a1238"><rect y="24" width="40" height="1.6"/><rect y="28" width="40" height="2.2"/><rect y="32.5" width="40" height="2.8"/></g><rect y="36" width="40" height="4" fill="#1a1238"/></g><rect x=".75" y=".75" width="38.5" height="38.5" rx="10.3" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="1.5"/></svg>`;
const ARROW = `<svg viewBox="0 0 20 20" aria-hidden="true"><path d="M12.5 4.5L7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
const crumbBar = (crumbs) => {
  const links = crumbs.filter(([h]) => h), parent = links[links.length - 1];
  const here = crumbs[crumbs.length - 1];
  return `<nav class="crumbs" aria-label="Breadcrumb"><a class="back" href="${parent[0]}">${ARROW}<span>${parent[1] === "Home" ? "Back to home" : "All " + esc(parent[1].toLowerCase())}</span></a><span class="trail">${crumbs.map(([h, l]) => (h ? `<a href="${h}">${esc(l)}</a>` : `<span aria-current="page">${esc(l)}</span>`)).join('<i aria-hidden="true">/</i>')}</span></nav>`;
};
const pageHead = (crumbs, title, lede) => `<section class="pagehead"><div class="wrap">
  ${crumbBar(crumbs)}
  <div class="plate"><div><h1>${esc(title)}</h1></div></div>
  ${lede ? `<p class="lede">${esc(lede)}</p>` : ""}
</div></section>`;

const sources = (list) => list && list.length ? `<section class="sources"><h2>Sources</h2><ul>${list.map((s) => `<li><a href="${esc(s.url)}" rel="nofollow noopener" target="_blank">${esc(s.title)}</a></li>`).join("")}</ul></section>` : "";
const status = (s) => s === "Reported" ? '<span class="chip rep">Reported</span>' : `<span class="chip ok">${s === "Confirmed" ? "Confirmed by Rockstar" : "Shown by Rockstar"}</span>`;
const breadcrumbLd = (items) => ({ "@context": "https://schema.org", "@type": "BreadcrumbList", itemListElement: items.map(([u, n], i) => ({ "@type": "ListItem", position: i + 1, name: n, item: SITE + u })) });

const personCard = (c) => `<a class="pcard" href="/characters/${c.id}/">${photo("characters", c.id, poster(c), `${c.name}, official GTA VI image`, { focus: c.photoFocus })}<div class="txt"><span class="role">${esc(c.role)}</span><h3>${esc(c.name)}</h3><p>${esc(c.summary)}</p></div></a>`;
const cast = (list, compact) => `<div class="cast${compact ? " compact" : ""}">${list.map(personCard).join("")}</div>`;
const placeCard = (p, i) => `<a class="card" href="/places/${p.id}/">${photo("places", p.id, art(p.name, "c" + i), `${p.name}, official GTA VI screenshot`)}<div class="cl"><b>${esc(p.name)}</b><span>${esc(p.tagline)}</span></div></a>`;
const gallery = (kind, id, name) => {
  const list = photos(kind, id).slice(1);
  if (!list.length) return "";
  return `<section class="pics"><div class="sec-head"><div><h2>In pictures</h2><p>${list.length} official ${list.length === 1 ? "shot" : "shots"} from Rockstar. Tap one to view it full size.</p></div></div><div class="mosaic" data-count="${Math.min(list.length, 9)}">${list.map((src, i) => `<a class="ph" href="${src}" data-lb="${kind}-${id}" aria-label="View ${esc(name)} photo ${i + 1} of ${list.length}"><img src="${src}" alt="${esc(name)}, official GTA VI screenshot ${i + 2}" loading="lazy" decoding="async"><span class="credit">Image: Rockstar Games</span></a>`).join("")}</div></section>`;
};
const vidCard = (v) => `<article class="vid" id="${v.id}"><div class="frame"><button class="play" type="button" data-yt="${esc(v.youtube)}" aria-label="Play ${esc(v.title)}"><img src="https://i.ytimg.com/vi/${esc(v.youtube)}/hqdefault.jpg" alt="" loading="lazy"></button>${v.length ? `<span class="len">${esc(v.length)}</span>` : ""}</div><div class="info">${v.date ? `<time datetime="${v.date}">${fmtDate(v.date)}</time>` : ""}<h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div></article>`;
const LB_SCRIPT = `(function(){var set=[],i=0,box,img,cap,last;function build(){box=document.createElement("div");box.className="lb";box.setAttribute("role","dialog");box.setAttribute("aria-modal","true");box.setAttribute("aria-label","Photo viewer");box.hidden=true;box.innerHTML='<button class="lb-x" type="button" aria-label="Close (Esc)">&times;</button><button class="lb-nav prev" type="button" aria-label="Previous photo">&#8249;</button><figure><img alt=""><figcaption></figcaption></figure><button class="lb-nav next" type="button" aria-label="Next photo">&#8250;</button>';document.body.appendChild(box);img=box.querySelector("img");cap=box.querySelector("figcaption");box.addEventListener("click",function(e){if(e.target===box||e.target.tagName==="FIGURE")close();else if(e.target.closest(".lb-x"))close();else if(e.target.closest(".prev"))go(-1);else if(e.target.closest(".next"))go(1)});}function show(){var a=set[i];img.src=a.getAttribute("href");img.alt=a.querySelector("img").alt;cap.textContent=(i+1)+" / "+set.length+"  ·  Image: Rockstar Games";box.classList.toggle("single",set.length<2);}function go(d){i=(i+d+set.length)%set.length;show();}function open(a){if(!box)build();set=[].slice.call(document.querySelectorAll('[data-lb="'+a.dataset.lb+'"]'));i=set.indexOf(a);last=a;show();box.hidden=false;document.documentElement.classList.add("lb-on");box.querySelector(".lb-x").focus();}function close(){box.hidden=true;img.removeAttribute("src");document.documentElement.classList.remove("lb-on");if(last)last.focus();}document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[data-lb]");if(!a||e.metaKey||e.ctrlKey)return;e.preventDefault();open(a)});document.addEventListener("keydown",function(e){if(!box||box.hidden)return;if(e.key==="Escape")close();else if(e.key==="ArrowLeft")go(-1);else if(e.key==="ArrowRight")go(1);});var sx=0;document.addEventListener("touchstart",function(e){if(box&&!box.hidden)sx=e.touches[0].clientX},{passive:true});document.addEventListener("touchend",function(e){if(!box||box.hidden)return;var dx=e.changedTouches[0].clientX-sx;if(Math.abs(dx)>50)go(dx<0?1:-1)});})();`;
const YT_SCRIPT = `document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".play[data-yt]");if(!b)return;var f=document.createElement("iframe");f.src="https://www.youtube-nocookie.com/embed/"+b.dataset.yt+"?autoplay=1&rel=0";f.title=b.getAttribute("aria-label");f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.allowFullscreen=true;b.replaceWith(f)});`;

const HEAD_FX = `<script type="speculationrules">{"prefetch":[{"where":{"href_matches":"/*"},"eagerness":"moderate"}]}</script>
<script>(function(){var d=document.documentElement,seen={};function pf(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a||a.target)return;var u=new URL(a.href,location.href);if(u.origin!==location.origin||u.pathname===location.pathname||seen[u.pathname])return;seen[u.pathname]=1;var l=document.createElement("link");l.rel="prefetch";l.href=u.pathname;document.head.appendChild(l)}if(!HTMLScriptElement.supports||!HTMLScriptElement.supports("speculationrules")){document.addEventListener("mouseover",pf,{passive:true});document.addEventListener("touchstart",pf,{passive:true})}if("onpagereveal" in window)return;d.classList.add("fx");addEventListener("pageshow",function(){d.classList.remove("leaving")});document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a[href]");if(!a||e.defaultPrevented||e.button||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||a.target||a.hasAttribute("download")||a.dataset.lb!==undefined)return;var u=new URL(a.href,location.href);if(u.origin!==location.origin||(u.pathname===location.pathname&&u.hash))return;if(matchMedia("(prefers-reduced-motion: reduce)").matches)return;e.preventDefault();d.classList.add("leaving");setTimeout(function(){location.href=u.href},140)})})();</script>`;
const TOK = { unlock: "Thu 19 Nov, 12:00 AM", country: "the US", std: "$79.99", ult: "$99.99", diff: "$20" };
const fillHtml = (s) => esc(s).replace(/\{(\w+)\}/g, (_, k) => `<b data-r="${k}">${TOK[k]}</b>`);
const fillText = (s) => s.replace(/\{(\w+)\}/g, (_, k) => TOK[k]);
const PRICE_NOTE = `<span class="rnote" data-r="note" hidden>Your store's price isn't on our list yet, so US prices are shown.</span>`;
const regionBar = (id) => `<div class="regionbar"><label for="${id}">Showing times and prices for</label><select id="${id}" data-region-picker></select></div>`;
const faqAnswer = (f) => fillHtml(f.a) + (f.a.includes("{std}") ? " " + PRICE_NOTE : "");
const factHtml = (f) => `<div class="fact"><span>${esc(f.label)}</span><b${f.dyn ? ` data-r="${f.dyn}"` : ""}>${esc(f.value)}</b></div>`;

/* ======================= pages ======================= */
// HOME
{
  const L = C.launch;
  const firstFeatures = C.features.groups.flatMap((g) => g.items).filter((f) => f.status === "Shown").slice(0, 6);
  const body = `
<section class="hero2">
  <img class="hero2-bg" src="/assets/img/places/vice-city.jpg" alt="" fetchpriority="high" decoding="async">
  <span class="hero2-credit">Image: Rockstar Games</span>
  <div class="wrap hero2-in">
    <p class="hero2-kick"><span class="pulse" aria-hidden="true"></span>19 November · PS5 and Xbox Series X|S</p>
    <h1><span>Everything GTA 6,</span><span>in one place.</span></h1>
    <p class="hero2-lede">Unlock times and prices for where you are, the cast, every region of Leonida, and a 100% tracker updated live from launch night.</p>
    <div class="hero2-actions"><a class="btn primary" href="/tracker/">Open the 100% tracker</a><a class="btn glass" href="/launch/" id="unlock">See when it unlocks</a></div>
  </div>
</section>
<main class="wrap">
  <div class="facts">${L.facts.map(factHtml).join("")}</div>

  <section class="sec">
    <div class="sec-head"><div><h2>Start here</h2><p>The three things most people need this week.</p></div></div>
    <div class="big">
      <a class="bigcard t1" href="/tracker/">${ICON.tracker}<h3>100% tracker</h3><p>Tick off collectibles, missables and trophies. Progress saves on your device.</p><span class="go">Open</span></a>
      <a class="bigcard t2" href="/launch/">${ICON.clock}<h3>When it unlocks</h3><p>Midnight local time, country by country. For you: <b data-r="unlock">Thu 19 Nov, 12:00 AM</b>.</p><span class="go">Live countdown</span></a>
      <a class="bigcard t3" href="/editions/">${ICON.tag}<h3>Which edition?</h3><p><b data-r="std">$79.99</b> or <b data-r="ult">$99.99</b>. What the extra <span data-r="diff">$20</span> actually buys you.</p><span class="go">Compare</span></a>
    </div>
  </section>

  ${VIDEOS.length ? `<section class="sec">
    <div class="sec-head"><div><h2>Watch the trailers</h2><p>Official videos from Rockstar.</p></div><a href="/videos/">All videos</a></div>
    <div class="vids feature">${vidCard(VIDEOS[0])}</div>
  </section>` : ""}

  <section class="sec">
    <div class="sec-head"><div><h2>Explore Leonida</h2><p>${esc(C.places.items.length)} regions Rockstar has named so far.</p></div><a href="/places/">All places</a></div>
    <div class="cards">${C.places.items.map(placeCard).join("")}</div>
  </section>

  <section class="sec">
    <div class="sec-head"><div><h2>Meet the cast</h2><p>Two playable leads and the people around them.</p></div><a href="/characters/">All characters</a></div>
    ${cast(C.characters.items.slice(0, 8), true)}
  </section>

  <section class="sec">
    <div class="sec-head"><div><h2>How it plays</h2><p>Confirmed in Rockstar's own footage.</p></div><a href="/features/">All gameplay details</a></div>
    <div class="fgrid">${firstFeatures.map((f) => `<div class="feat"><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></div>`).join("")}</div>
  </section>

  <section class="sec">
    <div class="sec-head"><div><h2>On the radio</h2><p>Six stations revealed so far, with more to come.</p></div><a href="/radio/">Stations and hosts</a></div>
    <div class="stations">${C.radio.stations.map((s) => `<a class="station" href="/radio/#${s.id}"><i style="background:${s.color}"></i>${esc(s.name)}</a>`).join("")}</div>
  </section>

  <section class="sec">
    <div class="sec-head"><div><h2>Quick answers</h2>${regionBar("rp-home")}</div><a href="/faq/">All questions</a></div>
    <div class="faq">${C.faq.items.slice(0, 4).map((f) => `<details><summary>${esc(f.q)}</summary><p>${faqAnswer(f)}</p></details>`).join("")}</div>
  </section>
</main>`;
  const script = YT_SCRIPT + `(function(){var a=document.getElementById("unlock");function f(){if(!window.GTAR)return;var l=GTAR.unlockAt()-Date.now();if(l<=0){a.textContent="Out now where you are";return}var h=Math.floor(l/36e5),m=Math.floor(l%36e5/6e4);a.textContent="Unlocks for you in "+(h?h+"h ":"")+m+"m"}document.addEventListener("gta-region",f);setInterval(f,3e4)})();`;
  write("index.html", layout({ url: "/", title: "Home", description: "Free GTA 6 100% tracker and guide: unlock time and price for your country, characters, every region of Leonida, radio and gameplay.", body, script,
    jsonld: [{ "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, alternateName: "trackgta6.com", url: SITE + "/", description: "Fan-made GTA 6 guide and free 100% completion tracker." }, TRACKER_APP_LD] }));
}

// CHARACTERS
{
  const groups = [...new Set(C.characters.items.map((c) => c.group))];
  const body = pageHead([["/", "Home"], [null, "Characters"]], "GTA 6 characters", C.characters.intro) + `<main class="wrap">
  ${groups.map((g) => `<section class="sec"><div class="sec-head"><h2>${esc(g)}</h2></div>${cast(C.characters.items.filter((c) => c.group === g), false)}</section>`).join("")}
  </main>`;
  write("characters/index.html", layout({ url: "/characters/", title: "Characters", description: "Every GTA 6 character revealed so far: Jason, Lucia, Cal, Boobie, Raul and more, with who they are and how they connect.", body, jsonld: breadcrumbLd([["/", "Home"], ["/characters/", "Characters"]]) }));

  C.characters.items.forEach((c, i, arr) => {
    const place = c.place && placeById[c.place];
    const prev = arr[(i - 1 + arr.length) % arr.length], next = arr[(i + 1) % arr.length];
    const conns = (c.connections || []).map((id) => charById[id]).filter(Boolean);
    const body = `<section class="chero">${photo("characters", c.id, poster(c), `${c.name}, official GTA VI image`, { eager: true, focus: c.photoFocus })}<div class="wrap">
      ${crumbBar([["/", "Home"], ["/characters/", "Characters"], [null, c.name]])}
      ${status(c.status)}
      <h1>${esc(c.name)}</h1>
      <p class="say">${esc(c.summary)}</p>
      <div class="meta"><span>${esc(c.role)}</span>${place ? `<span>${esc(place.name)}</span>` : ""}<span>${esc(c.group)}</span></div>
    </div></section>
    <main class="wrap">
    <div class="detail">
      <article>
        <div class="sec-head" style="margin-top:6px"><h2>Who they are</h2></div>
        <div class="story">${c.bio.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
        ${gallery("characters", c.id, c.name)}
      </article>
      <aside class="side">
        <div class="kf"><div><span>Role</span><b>${esc(c.role)}</b></div><div><span>Based in</span><b>${place ? `<a href="/places/${place.id}/">${esc(place.name)}</a>` : "Not stated yet"}</b></div><div><span>Circle</span><b>${esc(c.group)}</b></div><div><span>Revealed</span><b>6 May 2025</b></div></div>
        ${place ? placeCard(place, "s" + i) : ""}
      </aside>
    </div>
    ${conns.length ? `<section class="sec"><div class="sec-head"><div><h2>Connected to</h2><p>The people ${esc(c.name.split(" ")[0])} is tied to.</p></div></div>${cast(conns, true)}</section>` : ""}
    <nav class="pager" aria-label="More characters"><a href="/characters/${prev.id}/"><span>Previous</span><b>${esc(prev.name)}</b></a><a class="next" href="/characters/${next.id}/"><span>Next</span><b>${esc(next.name)}</b></a></nav>
    </main>`;
    write(`characters/${c.id}/index.html`, layout({ url: `/characters/${c.id}/`, image: photos("characters", c.id)[0], title: `${c.name} in GTA 6`, description: fitDesc(`${c.name} in GTA 6: ${c.summary}`, "Who they are, where they're based and who they're connected to."), body,
      jsonld: breadcrumbLd([["/", "Home"], ["/characters/", "Characters"], [`/characters/${c.id}/`, c.name]]) }));
  });
}

// PLACES
{
  const body = pageHead([["/", "Home"], [null, "Places"]], "Places in Leonida", C.places.intro) + `<main class="wrap"><section class="sec"><div class="cards">${C.places.items.map(placeCard).join("")}</div></section></main>`;
  write("places/index.html", layout({ url: "/places/", title: "Places in Leonida", description: "Every GTA 6 region so far: Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia and Mount Kalaga, with landmarks.", body, jsonld: breadcrumbLd([["/", "Home"], ["/places/", "Places"]]) }));

  C.places.items.forEach((p, i, arr) => {
    const people = C.characters.items.filter((c) => c.place === p.id);
    const prev = arr[(i - 1 + arr.length) % arr.length], next = arr[(i + 1) % arr.length];
    const body = `<section class="phero">${photo("places", p.id, art(p.name, "b" + i), `${p.name}, official GTA VI screenshot`, { eager: true })}<div class="wrap">
      ${crumbBar([["/", "Home"], ["/places/", "Places"], [null, p.name]])}
      ${status("Confirmed")}
      <h1>${esc(p.name)}</h1>
      <p class="say">${esc(p.tagline)}</p>
    </div></section>
    <main class="wrap">
    <div class="detail">
      <article>
        <div class="story">${p.about.map((t) => `<p>${esc(t)}</p>`).join("")}</div>
        ${gallery("places", p.id, p.name)}
        ${p.spots.length ? `<section class="sec"><div class="sec-head"><h2>Spots to know</h2></div><ul class="spots">${p.spots.map((s) => `<li><b>${esc(s.name)}</b><span>${esc(s.note)}</span></li>`).join("")}</ul></section>` : ""}
      </article>
      <aside class="side">
        <div class="box"><h2>On the 100% tracker</h2><p style="margin:0 0 12px;color:var(--soft)">Collectibles, activities and missables found in ${esc(p.name)}, added as they're found from launch night.</p><a class="btn primary" href="/tracker/?region=${encodeURIComponent(p.tracker)}">Track ${esc(p.tracker)}</a></div>
        <div class="box"><h2>Status</h2><p style="margin:0;color:var(--soft);font-size:15px">Named and described on Rockstar's official site. Exact map position comes with the game.</p></div>
      </aside>
    </div>
    ${people.length ? `<section class="sec"><div class="sec-head"><h2>Who you'll meet here</h2></div>${cast(people, true)}</section>` : ""}
    <nav class="pager" aria-label="More places"><a href="/places/${prev.id}/"><span>Previous</span><b>${esc(prev.name)}</b></a><a class="next" href="/places/${next.id}/"><span>Next</span><b>${esc(next.name)}</b></a></nav>
    </main>`;
    write(`places/${p.id}/index.html`, layout({ url: `/places/${p.id}/`, image: photos("places", p.id)[0], title: `${p.name} in GTA 6`, description: fitDesc(`${p.name} in GTA 6: ${p.about[0]}`, "Landmarks, characters and what to track there."), body,
      jsonld: breadcrumbLd([["/", "Home"], ["/places/", "Places"], [`/places/${p.id}/`, p.name]]) }));
  });
}

// RADIO
{
  const R = C.radio;
  const bars = (n) => Array.from({ length: 18 }, (_, i) => `<i style="--h:${18 + ((n * 37 + i * 53) % 70)}%;--d:${(((n + i) * 97) % 9) / 10 + 0.5}s"></i>`).join("");
  const mic = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.9V21h2v-3.1A7 7 0 0 0 19 11h-2Z" fill="currentColor"/></svg>`;
  const body = pageHead([["/", "Home"], [null, "Radio"]], "GTA 6 radio stations", R.intro) + `<main class="wrap">
  <section class="tuner" aria-label="Pick a station">
    <div class="tuner-face"><div class="tuner-scale" aria-hidden="true">${Array.from({ length: 61 }, (_, i) => `<i class="${i % 10 === 0 ? "big" : i % 5 === 0 ? "mid" : ""}"></i>`).join("")}</div>
      <div class="tuner-needle" aria-hidden="true"></div>
      <div class="tuner-btns">${R.stations.map((s, i) => `<button type="button" data-st="${s.id}" style="--c:${s.color};--x:${(i + 0.5) / R.stations.length}" aria-pressed="false">${esc(s.name)}</button>`).join("")}</div>
    </div>
  </section>
  <section class="stereos">${R.stations.map((s, i) => `<article class="stereo" id="${s.id}" style="--c:${s.color}" tabindex="-1">
    <div class="st-face">
      <span class="st-mark" aria-hidden="true">${esc(s.name)}</span>
      <div class="lcd"><span class="lcd-on" aria-hidden="true">ON AIR</span><b>${esc(s.name)}</b><span class="lcd-genre">${esc(s.genre)}</span></div>
      <div class="vu" aria-hidden="true">${bars(i + 1)}</div>
    </div>
    <div class="st-body"><p>${esc(s.note)}</p><ul class="hosts">${s.hosts.map((h) => `<li>${mic}<b>${esc(h.name)}</b><span>${h.voice === h.name ? "as themselves" : "voiced by " + esc(h.voice)}</span></li>`).join("")}</ul></div>
  </article>`).join("")}</section>
  <section class="sec"><div class="sec-head"><h2>How radio works in GTA 6</h2></div><div class="notes">${R.howItWorks.map((t) => `<div class="note">${esc(t)}</div>`).join("")}</div></section>
  </main>`;
  const script = `(function(){var btns=[].slice.call(document.querySelectorAll(".tuner-btns button")),needle=document.querySelector(".tuner-needle"),face=document.querySelector(".tuner-face");function tune(id,scroll){btns.forEach(function(b){var on=b.dataset.st===id;b.setAttribute("aria-pressed",on);if(on){needle.style.left=(b.style.getPropertyValue("--x")*100)+"%";face.style.setProperty("--c",b.style.getPropertyValue("--c"))}});document.querySelectorAll(".stereo").forEach(function(s){s.classList.toggle("live",s.id===id)});if(scroll){var el=document.getElementById(id);el.scrollIntoView({behavior:matchMedia("(prefers-reduced-motion: reduce)").matches?"auto":"smooth",block:"center"});el.focus({preventScroll:true})}}btns.forEach(function(b){b.addEventListener("click",function(){tune(b.dataset.st,true)})});document.querySelectorAll(".stereo").forEach(function(s){s.addEventListener("click",function(){tune(s.id,false)})});tune((location.hash||"").slice(1)||btns[0].dataset.st,!!location.hash)})();`;
  write("radio/index.html", layout({ url: "/radio/", title: "Radio stations", description: "All six GTA 6 radio stations revealed so far, with genres and celebrity hosts, from Flash FM to Back Country Radio.", body, script, jsonld: breadcrumbLd([["/", "Home"], ["/radio/", "Radio"]]) }));
}

// FEATURES (photo-led chapters)
{
  const F = C.features;
  const PIC = { "Story and characters": "/assets/img/characters/lucia-caminos-3.jpg", "Combat and the police": "/assets/img/places/vice-city-8.jpg", "Things to do": "/assets/img/places/leonida-keys-2.jpg", "Phone, social and music": "/assets/img/characters/real-dimez-2.jpg", "Business model": "/assets/img/places/vice-city-2.jpg" };
  const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const all = F.groups.flatMap((g) => g.items), shown = all.filter((f) => f.status === "Shown").length;
  const body = pageHead([["/", "Home"], [null, "Gameplay"]], "How GTA 6 plays", F.intro) + `<main class="wrap">
  <div class="gp-top">
    <div class="gp-count"><div><b>${all.length}</b><span>details so far</span></div><div class="s"><b>${shown}</b><span>shown by Rockstar</span></div><div class="r"><b>${all.length - shown}</b><span>reported by press</span></div></div>
    <nav class="gp-toc" aria-label="Chapters">${F.groups.map((g) => `<a href="#${slug(g.name)}"><img src="${PIC[g.name] || ""}" alt="" loading="lazy"><span>${esc(g.name)}</span></a>`).join("")}</nav>
  </div>
  ${F.groups.map((g) => `<section class="chap" id="${slug(g.name)}">
    <div class="chap-band">${PIC[g.name] ? `<img src="${PIC[g.name]}" alt="" loading="lazy" decoding="async"><span class="credit">Image: Rockstar Games</span>` : ""}<div class="chap-t"><span>${g.items.length} details</span><h2>${esc(g.name)}</h2></div></div>
    <ul class="chap-list">${g.items.map((f) => `<li class="${f.status === "Reported" ? "rep" : "shown"}"><span class="mk">${f.status === "Reported" ? "Reported" : "Shown by Rockstar"}</span><h3>${esc(f.title)}</h3><p>${esc(f.text)}</p></li>`).join("")}</ul>
  </section>`).join("")}
  </main>`;
  write("features/index.html", layout({ url: "/features/", title: "Gameplay details", description: "Every confirmed GTA 6 gameplay detail: six wanted stars, switching between Jason and Lucia, combat, activities, phone and social media.", body, jsonld: breadcrumbLd([["/", "Home"], ["/features/", "Gameplay"]]) }));
}

// EDITIONS
{
  const E = C.editions;
  const types = [...new Set(E.ultimate.map((u) => u.type))];
  const body = pageHead([["/", "Home"], [null, "Editions & prices"]], "Editions and prices", E.intro) + `<main class="wrap">
  <section class="sec"><div class="yp"><div class="yp-head"><label for="rp-ed">Prices for</label><select id="rp-ed" data-region-picker></select></div>
    <div class="yp-row"><div><span>Standard</span><b data-r="std">$79.99</b></div><div><span>Ultimate</span><b data-r="ult">$99.99</b></div><div><span>Ultimate costs</span><b>+<span data-r="diff">$20</span></b></div></div>${PRICE_NOTE}</div>
    <div class="sec-head" style="margin-top:26px"><div><h2>Official prices by region</h2><p>Same on PS5 and Xbox Series X|S.</p></div></div><div class="prices">${E.prices.map((p) => `<div class="price" data-price-region="${p.key}"><h3>${esc(p.region)}</h3><div class="p"><span>Standard</span><b>${esc(p.standard)}</b></div><div class="p"><span>Ultimate</span><b>${esc(p.ultimate)}</b></div></div>`).join("")}</div></section>
  <section class="sec"><div class="sec-head"><h2>Standard vs Ultimate</h2></div><div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>Standard</th><th>Ultimate</th></tr></thead><tbody>${E.compare.map((r) => `<tr><td><b>${esc(r.label)}</b></td><td>${esc(r.standard)}</td><td>${esc(r.ultimate)}</td></tr>`).join("")}</tbody></table></div>
    <p class="prose" style="margin-top:14px;color:var(--soft)">Short version: everything Ultimate adds is optional. Cars, weapons, outfits, shops and two side activities, nothing you need to finish the story.</p></section>
  <section class="sec"><div class="sec-head"><div><h2>Vintage Vice City Pack</h2><p>${esc(E.packRules)}</p></div></div><div class="items">${E.pack.map((x) => `<div class="item"><b>${esc(x.name)}</b><p>${esc(x.note)}</p></div>`).join("")}</div></section>
  <section class="sec"><div class="sec-head"><div><h2>What Ultimate adds</h2><p>All ${E.ultimate.length} extras, grouped by type.</p></div></div>
    ${types.map((t) => `<h3 style="margin:18px 0 10px;font-size:18px">${esc(t)}s</h3><div class="items">${E.ultimate.filter((u) => u.type === t).map((x) => `<div class="item"><b>${esc(x.name)}</b><p>${esc(x.note)}</p></div>`).join("")}</div>`).join("")}</section>
  </main>`;
  write("editions/index.html", layout({ url: "/editions/", title: "Editions and prices", description: "GTA 6 prices by country, Standard vs Ultimate compared, all 16 Ultimate extras and the Vintage Vice City pre-order pack.", body, jsonld: breadcrumbLd([["/", "Home"], ["/editions/", "Editions & prices"]]) }));
}

// LAUNCH (live countdown + launch facts)
{
  const L = C.launch;
  const CD_JS = fs.readFileSync(path.join(ROOT, "src/js/countdown.js"), "utf8");
  const body = `<div class="cd">
  <section class="cdhero" id="hero"><div class="wrap">
    ${crumbBar([["/", "Home"], [null, "Launch"]])}
    <p class="cd-kick">PS5 and Xbox Series X|S · Thursday 19 November 2026</p>
    <h1>Unlocks in <span class="where" id="heroName">your country</span></h1>
    <div class="picker"><label for="country">Countdown for</label><select id="country"></select></div>
    <div class="clock" aria-live="off">
      <div class="unit"><span class="num" id="d">00</span><span class="lab">Days</span></div>
      <div class="unit"><span class="num" id="h">00</span><span class="lab">Hours</span></div>
      <div class="unit"><span class="num" id="m">00</span><span class="lab">Minutes</span></div>
      <div class="unit"><span class="num" id="s">00</span><span class="lab">Seconds</span></div>
    </div>
    <div class="out" id="outMsg">It's out.</div>
    <div class="cdmeta"><span>Local unlock <strong id="heroLocal">–</strong></span><span>On your clock <strong id="heroYou">–</strong></span></div>
  </div></section>
  <main class="wrap">
    <div class="facts">${L.facts.map(factHtml).join("")}</div>
    <section class="sec" aria-labelledby="waveTitle"><div class="sec-head"><div><h2 id="waveTitle">The midnight wave</h2><p>Launch rolls west around the world for about 19 hours, from New Zealand to the Americas. Each dot is one unlock moment, shown in your time. Tap one to jump to it.</p></div></div>
      <div class="wave-scroll"><div class="wave" id="wave"></div></div></section>
    <section class="sec" aria-labelledby="boardTitle"><div class="sec-head"><div><h2 id="boardTitle">Every country, live</h2><p>Tap a row to put it in the big countdown.</p></div></div>
      <div class="tools"><input type="search" id="q" placeholder="Search a country" aria-label="Search a country">
        <div class="seg" role="group" aria-label="Sort"><button type="button" id="sortTime" aria-pressed="true">First to unlock</button><button type="button" id="sortName" aria-pressed="false">A–Z</button></div>
        <span class="count" id="count"></span></div>
      <div class="board" id="board" role="list"></div>
      <p class="cd-fine">The US and Canada unlock together at midnight Eastern, so the West Coast starts at 9 PM on the 18th. Other countries with several time zones are shown at their capital's midnight. Rockstar can still change timing, so check your console store on the night.</p></section>
    <section class="sec"><div class="sec-head"><h2>Good to know</h2></div><div class="notes">${L.notes.map((n) => `<div class="note">${esc(n)}</div>`).join("")}</div></section>
    <section class="sec"><div class="sec-head"><div><h2>The road to launch</h2><p>From the first trailer to release day.</p></div></div>
      <ol class="tl">${L.timeline.map((t) => `<li data-date="${t.date}"><time datetime="${t.date}">${fmtDate(t.date)}</time><b>${esc(t.title)}</b><p>${esc(t.text)}</p></li>`).join("")}</ol></section>
  </main></div>`;
  const script = CD_JS + `(function(){var now=Date.now(),marked=false;document.querySelectorAll(".tl li").forEach(function(li){var d=Date.parse(li.dataset.date+"T23:59:59");if(d<now)li.classList.add("past");else if(!marked){li.classList.add("next");marked=true}})})();`;
  write("launch/index.html", layout({ url: "/launch/", title: "Live countdown and launch times by country", description: "Live GTA 6 countdown: exactly when it unlocks where you are, the midnight wave around the world, pre-load and install size.", body, script, jsonld: breadcrumbLd([["/", "Home"], ["/launch/", "Launch"]]) }));
}

// VIDEOS
{
  const body = pageHead([["/", "Home"], [null, "Videos"]], "GTA 6 trailers and videos", C.videos.intro) + `<main class="wrap"><section class="sec"><div class="vids">${VIDEOS.map(vidCard).join("")}</div></section></main>`;
  write("videos/index.html", layout({ url: "/videos/", title: "Trailers and videos", description: "Watch every official GTA 6 video: the Launch Trailer, An Extended Look, Trailer 2, Trailer 1 and the cover art reveal, with dates and what each one shows.", body, script: YT_SCRIPT, jsonld: breadcrumbLd([["/", "Home"], ["/videos/", "Videos"]]) }));
}

// FAQ
{
  const F = C.faq;
  const groups = [["Launch and release", C.launch.sources], ["Prices and editions", C.editions.sources], ["Answers on this page", F.sources], ["Characters", C.characters.sources], ["Places", C.places.sources], ["Gameplay", C.features.sources], ["Radio", C.radio.sources], ["Videos", C.videos.sources]];
  const body = pageHead([["/", "Home"], [null, "FAQ"]], "GTA 6 FAQ", F.intro) + `<main class="wrap"><section class="sec">${regionBar("rp-faq")}<div class="faq">${F.items.map((f, i) => `<details${i < 2 ? " open" : ""}><summary>${esc(f.q)}</summary><p>${faqAnswer(f)}${f.link ? ` <a href="${f.link}">More</a>` : ""}</p></details>`).join("")}</div></section>
  <section class="sec srcall" id="sources"><div class="sec-head"><div><h2>Where our facts come from</h2><p>Everything on this site comes from Rockstar's own material or the reporting below. Anything that comes from previews or interviews is marked "Reported" where it appears.</p></div></div>
  <div class="srcgrid">${groups.map(([t, list]) => `<div class="srcbox"><h3>${esc(t)}</h3><ul>${list.map((s) => `<li><a href="${esc(s.url)}" rel="noopener" target="_blank">${esc(s.title)}</a></li>`).join("")}</ul></div>`).join("")}</div></section></main>`;
  write("faq/index.html", layout({ url: "/faq/", title: "FAQ", description: "Quick answers to the top GTA 6 questions: unlock time and price where you are, PC version, online, consoles, frame rate and download size.", body,
    jsonld: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: F.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: fillText(f.a) } })) } }));
}

// ABOUT
{
  const body = pageHead([["/", "Home"], [null, "About"]], "About this site", "A free, fan-made GTA 6 guide.") + `<main class="wrap"><section class="sec prose">
  <p>Everything before launch comes from Rockstar's official material: the GTA VI website, trailers, the Extended Look and Newswire posts. <a href="/faq/#sources">The FAQ lists every source</a>, and anything that comes from previews or interviews is marked "Reported".</p>
  <p>From launch night, the 100% tracker is filled in from real play. Items are only added once they've been seen in the game. Nothing here comes from leaks.</p>
  <p>All writing is original. Screenshots are official images released by Rockstar Games and are credited on every photo.</p>
  <p>This site is not affiliated with or endorsed by Rockstar Games or Take-Two Interactive.</p>
  </section></main>`;
  write("about/index.html", layout({ url: "/about/", title: "About", description: "About this fan-made GTA 6 guide: where the information comes from and how the tracker is built.", body }));
}

// 404
write("404.html", layout({ url: "/404", title: "Page not found", description: "This page doesn't exist.", body: pageHead([["/", "Home"]], "Wrong turn", "This road doesn't go anywhere. Try the tracker or head back home.") + `<main class="wrap"><section class="sec"><a class="btn primary" href="/">Back to home</a> <a class="btn dark" href="/tracker/">Open the tracker</a></section></main>` }));
pages.pop(); // 404 is not in the sitemap

/* ======================= static files ======================= */
copyDir(path.join(ROOT, "src/assets"), path.join(OUT, "assets"));
fs.copyFileSync(path.join(ROOT, "data.json"), path.join(OUT, "data.json"));
// TRACKER: same engine as src/tracker.html, new design inside the site layout
{
  const src = fs.readFileSync(path.join(ROOT, "src/tracker.html"), "utf8");
  const fallback = src.match(/<script type="application\/json" id="fallback">[\s\S]*?<\/script>/)[0];
  let js = src.slice(src.lastIndexOf("<script>") + 8, src.lastIndexOf("</script>"));
  const patch = (a, b2) => { if (!js.includes(a)) throw new Error("tracker patch missing: " + a); js = js.replace(a, b2); };
  patch('b.innerHTML = art(r, i);', 'b.innerHTML = TK_IMG[r] ? \'<img src="\' + TK_IMG[r] + \'" alt="" loading="lazy" decoding="async">\' : art(r, i);');
  patch('$("bar").style.width = p + "%";', '$("bar").style.width = p + "%"; $("hero").style.setProperty("--p", p);');
  const IMG = { "Vice City": "vice-city", "Leonida Keys": "leonida-keys", "Grassrivers": "grassrivers", "Port Gellhorn": "port-gellhorn", "Ambrosia": "ambrosia", "Mount Kalaga": "mount-kalaga" };
  const TK_IMG = Object.fromEntries(Object.entries(IMG).map(([k, v]) => [k, photos("places", v)[0] || ""]));
  const body = `<div class="tk">
  <div class="tk-float" id="mini" aria-hidden="true"><span class="ring-s"></span><strong id="miniName">100% Tracker</strong><span id="miniPct">0%</span></div>
  <section class="tk-hero" id="hero">
    <img class="tk-bg" src="${photos("places", "vice-city")[3] || ""}" alt="" fetchpriority="high" decoding="async"><span class="hero2-credit">Image: Rockstar Games</span>
    <div class="wrap tk-hero-in">
      <div>
        ${crumbBar([["/", "Home"], [null, "100% Tracker"]])}
        <p class="hero2-kick"><span class="pulse" aria-hidden="true"></span>Mapped live from launch night</p>
        <h1 id="siteName">100% Tracker</h1>
        <p class="tk-tag" id="tagline"></p>
        <p class="tk-upd" id="updated"></p>
      </div>
      <div class="tk-ring" aria-live="polite"><div class="tk-ring-in"><b id="pct">0%</b><span id="count">0 of 0 done</span></div></div>
    </div>
    <div class="wrap"><div class="tk-meter" role="progressbar" aria-label="Overall completion" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" id="road"><i id="bar"></i></div></div>
  </section>
  <main class="wrap">
    <section class="tk-work" id="edit" hidden aria-labelledby="editTitle">
      <h2 id="editTitle">Edit mode</h2>
      <p>Only you see this. Add items as drafts, then press Publish drafts: they go straight to GitHub and are live in about a minute. Never change an item ID once it's published, or visitors lose their ticks.</p>
      <div class="qa">
        <div class="qa-top"><div><h3>Quick add with AI</h3><p>Pick screenshots, add a few words to each (or tap the mic), then let AI draft them. Check, fix, publish.</p></div>
          <label class="tk-btn solid qa-pick"><input type="file" id="qaFiles" accept="image/*" multiple>Add screenshots</label></div>
        <div id="qaList" class="qa-list"></div>
        <div class="tk-btns" id="qaActions" hidden><button class="tk-btn solid" type="button" id="qaDraft">Draft with AI</button><button class="tk-btn solid" type="button" id="qaPublish">Publish all</button><button class="tk-btn ghost" type="button" id="qaClear">Clear</button></div>
      </div>
      <p class="qa-or">Or add one by hand</p>
      <form class="tk-form" id="addForm" autocomplete="off">
        <select id="fCat" aria-label="Category"></select>
        <select id="fRegion" aria-label="Region"></select>
        <input class="full" type="text" id="fName" placeholder="Name, e.g. #12 – rooftop above the pier diner" required aria-label="Item name">
        <textarea class="full" id="fNote" placeholder="How to find or complete it" aria-label="Note"></textarea>
        <label class="full tk-file"><span>Screenshot (optional)</span><input type="file" id="fPhoto" accept="image/*"></label>
        <div class="checks full"><label><input type="checkbox" id="fMiss"> Missable</label><label><input type="checkbox" id="fSpoil"> Spoiler</label></div>
        <button class="tk-btn solid full" type="submit">Add item</button>
      </form>
      <div class="pub-status" id="pubStatus" role="status" aria-live="polite" hidden></div>
      <div class="tk-psn" id="psnBox">
        <h3>Trophies from PlayStation</h3>
        <p>Loads the official trophy list (names, requirements, grades and how many players have each). Run it again any time: your tips, regions and photos stay.</p>
        <div class="tk-btns"><button class="tk-btn" type="button" id="psnCheck">Check for the GTA 6 trophy list</button></div>
        <div id="psnOut" role="status" aria-live="polite"></div>
      </div>
      <div class="tk-btns"><button class="tk-btn solid" type="button" id="publish">Publish drafts</button><button class="tk-btn" type="button" id="dlData">Download data.json</button><button class="tk-btn" type="button" id="copyData">Copy JSON</button><button class="tk-btn ghost" type="button" id="clearDrafts">Clear drafts</button></div>
    </section>

    <section class="tk-sec" aria-labelledby="catTitle">
      <div class="sec-head"><div><h2 id="catTitle">What are you hunting?</h2><p>Pick a category, or keep everything in view.</p></div></div>
      <div class="tk-tiles" id="tiles"></div>
    </section>

    <section class="tk-sec" aria-labelledby="regTitle">
      <div class="sec-head"><div><h2 id="regTitle">Explore Leonida</h2><p>Tap a region to see only what's there. Tap it again to see everywhere.</p></div></div>
      <div class="tk-cards" id="cards"></div>
    </section>

    <section class="tk-sec" aria-labelledby="listTitle">
      <div class="sec-head"><div><h2 id="listTitle">Checklist</h2><p>Tick things off as you go. Missables are marked so you don't lose them for good.</p></div></div>
      <div class="tk-filters">
        <label class="sr" for="q">Search items</label>
        <div class="tk-search"><svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="9" cy="9" r="6" fill="none" stroke="currentColor" stroke-width="2"/><path d="M14 14l4 4" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><input type="search" id="q" placeholder="Search items or places"></div>
        <label class="tk-switch"><input type="checkbox" id="hideDone"><span></span>Hide completed</label>
        <label class="tk-switch"><input type="checkbox" id="showSpoilers"><span></span>Show spoilers</label>
      </div>
      <div class="tk-active" id="active"></div>
      <div id="list"></div>
    </section>

    <section class="tk-mine" aria-labelledby="mineTitle">
      <div><h2 id="mineTitle">Your progress</h2><p>Ticks are saved in this browser. Back them up to move them to another phone or computer.</p></div>
      <div class="tk-btns"><button class="tk-btn" type="button" id="backup">Back up progress</button><button class="tk-btn" type="button" id="restoreBtn">Restore progress</button><input type="file" id="restore" accept="application/json,.json" hidden><button class="tk-btn ghost" type="button" id="reset">Reset progress</button></div>
    </section>
  </main>
  <div class="tk-toast" id="toast" role="status"></div>
  ${fallback}
  </div>`;
  write("tracker/index.html", layout({ url: "/tracker/", title: "GTA 6 100% Tracker & Missables Checklist", description: "Free GTA 6 100% checklist: missables, collectibles, activities and trophies by region, with photos. Updated daily from launch.", body, script: `var TK_IMG = ${JSON.stringify(TK_IMG)};` + js, jsonld: [TRACKER_APP_LD, breadcrumbLd([["/", "Home"], ["/tracker/", "100% Tracker"]])] }));
}
write("countdown/index.html", `<!DOCTYPE html><html lang="en"><head><meta charset="utf-8"><title>Moved to the Launch page</title><meta name="robots" content="noindex"><link rel="canonical" href="${SITE}/launch/"><meta http-equiv="refresh" content="0;url=/launch/"><style>html{background:#1b1d24;color:#f7f4ee;font-family:system-ui}</style></head><body><p>The countdown now lives on the <a style="color:#f7c318" href="/launch/">Launch page</a>.</p></body></html>`);

const today = new Date().toISOString().slice(0, 10);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
write("_redirects", "/countdown /launch/ 301\n/countdown/ /launch/ 301\n");
write("_headers", "/assets/img/*\n  Cache-Control: public, max-age=604800\n/assets/*.js\n  Cache-Control: public, max-age=3600\n");
write("robots.txt", `User-agent: *\nDisallow: /edit\nSitemap: ${SITE}/sitemap.xml\n`);
write("manifest.webmanifest", JSON.stringify({
  name: "GTA 6 100% Tracker", short_name: "GTA 6 Tracker", id: "/", start_url: "/tracker/", scope: "/",
  display: "standalone", background_color: "#1b1d24", theme_color: "#141433",
  description: "Free GTA 6 100% completion tracker and guide.",
  icons: [
    { src: "/assets/icon-192.png", sizes: "192x192", type: "image/png" },
    { src: "/assets/icon-512.png", sizes: "512x512", type: "image/png" },
    { src: "/assets/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
  ],
}, null, 2));
write("llms.txt", `# trackgta6.com – GTA 6 Guide & 100% Tracker

> Fan-made, unofficial guide to Grand Theft Auto VI (GTA 6) with a free 100% completion tracker.
> The tracker lists missables, collectibles, side activities and trophies by region of Leonida, with photos,
> and is updated from launch day (19 November 2026) by a player on PS5. Progress is saved in the visitor's browser.

## Main pages
- [100% completion tracker](${SITE}/tracker/): checklist of missables, collectibles, activities and trophies, filterable by region
- [Launch times](${SITE}/launch/): live countdown and the exact unlock time in every country
- [Editions and prices](${SITE}/editions/): Standard vs Ultimate, prices by country
- [FAQ](${SITE}/faq/): quick answers (unlock time, PC version, consoles, download size, online) with sources
- [Characters](${SITE}/characters/): Jason, Lucia and the rest of the revealed cast
- [Places](${SITE}/places/): Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia, Mount Kalaga
- [Gameplay](${SITE}/features/), [Radio stations](${SITE}/radio/), [Videos](${SITE}/videos/)

## Data
- [Tracker data (JSON)](${SITE}/data.json): every tracker item with id, name, region, note and flags
`);

console.log(`Built ${pages.length} pages into dist/`);
