// Builds the GTA 6 Guide into ./dist. No dependencies: run `node build.mjs`.
// Vercel runs this automatically on every commit (see vercel.json).
// Edit the content in ./content/*.json and the tracker data in ./data.json.

import fs from "node:fs";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);
const OUT = path.join(ROOT, "dist");
const SITE = (process.env.SITE_URL || "https://gta6-tracker-snowy.vercel.app").replace(/\/$/, "");
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

function layout({ url, title, description, body, jsonld, script }) {
  pages.push(url);
  const full = url === "/" ? `${SITE_NAME}: release times, prices, characters, map and 100% tracker` : `${title} | ${SITE_NAME}`;
  const nav = NAV.map(([h, l]) => `<a href="${h}"${h === url || (h !== "/" && url.startsWith(h)) ? ' aria-current="page"' : ""}${h === "/tracker/" ? ' class="cta"' : ""}>${l}</a>`).join("");
  return `<!DOCTYPE html>
<html lang="en-IN">
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
<meta name="theme-color" content="#141433">
<link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
<script>window.va = window.va || function () { (window.vaq = window.vaq || []).push(arguments); };</script>
<script defer src="/_vercel/insights/script.js"></script>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@700;800;900&family=Instrument+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="/assets/site.css">
${jsonld ? `<script type="application/ld+json">${JSON.stringify(jsonld).replace(/</g, "\\u003c")}</script>` : ""}
</head>
<body>
<header class="bar"><div class="wrap"><a class="logo" href="/" aria-label="${SITE_NAME} home"><span><b>GTA 6 Guide</b><small>Leonida field guide</small></span></a><nav class="nav" aria-label="Main">${nav}</nav></div></header>
${body}
<footer class="site"><div class="wrap">
  <div class="cols"><nav aria-label="Footer"><a href="/">Home</a>${NAV.map(([h, l]) => `<a href="${h}">${l}</a>`).join("")}<a href="/countdown/">Countdown</a><a href="/about/">About</a></nav></div>
  <p>Fan-made and unofficial. Not affiliated with or endorsed by Rockstar Games or Take-Two Interactive. Grand Theft Auto and related names are trademarks of their owners. All illustrations on this site are original. Every fact links to its source.</p>
</div></footer>
${script ? `<script>${script}</script>` : ""}
</body>
</html>`;
}

const pageHead = (crumbs, title, lede) => `<section class="pagehead"><div class="wrap">
  <div class="crumbs">${crumbs.map(([h, l]) => (h ? `<a href="${h}">${esc(l)}</a>` : esc(l))).join(" / ")}</div>
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
  return list.length ? `<section class="sec"><div class="sec-head"><h2>Gallery</h2></div><div class="gallery">${list.map((src, i) => `<a class="ph" href="${src}" target="_blank" rel="noopener"><img src="${src}" alt="${esc(name)}, official GTA VI screenshot ${i + 2}" loading="lazy" decoding="async"><span class="credit">Image: Rockstar Games</span></a>`).join("")}</div></section>` : "";
};

const vidCard = (v) => `<article class="vid" id="${v.id}"><div class="frame"><button class="play" type="button" data-yt="${esc(v.youtube)}" aria-label="Play ${esc(v.title)}"><img src="https://i.ytimg.com/vi/${esc(v.youtube)}/hqdefault.jpg" alt="" loading="lazy"></button>${v.length ? `<span class="len">${esc(v.length)}</span>` : ""}</div><div class="info">${v.date ? `<time datetime="${v.date}">${fmtDate(v.date)}</time>` : ""}<h3>${esc(v.title)}</h3><p>${esc(v.text)}</p></div></article>`;
const YT_SCRIPT = `document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".play[data-yt]");if(!b)return;var f=document.createElement("iframe");f.src="https://www.youtube-nocookie.com/embed/"+b.dataset.yt+"?autoplay=1&rel=0";f.title=b.getAttribute("aria-label");f.allow="autoplay; encrypted-media; picture-in-picture; fullscreen";f.allowFullscreen=true;b.replaceWith(f)});`;

/* ======================= pages ======================= */
// HOME
{
  const L = C.launch;
  const firstFeatures = C.features.groups.flatMap((g) => g.items).filter((f) => f.status === "Shown").slice(0, 6);
  const body = `
<section class="hero home">${HERO}
  <div class="wrap">
    <div class="sign"><div class="sign-in">
      <p class="kick">Leonida field guide</p>
      <h1>Everything GTA 6, in one place</h1>
      <p class="lede">Release times, prices in India, the cast, every region of Leonida, and a 100% tracker updated live from launch night.</p>
      <div class="row"><a class="btn primary" href="/tracker/">Open the 100% tracker</a><a class="btn ghost" href="/launch/" id="unlock">Unlock times</a></div>
    </div></div>
    <div class="posts" aria-hidden="true"><i></i><i></i></div>
  </div>
</section>
<main class="wrap">
  <div class="facts">${L.facts.map((f) => `<div class="fact"><span>${esc(f.label)}</span><b>${esc(f.value)}</b></div>`).join("")}</div>

  <section class="sec">
    <div class="sec-head"><div><h2>Start here</h2><p>The three things most people need this week.</p></div></div>
    <div class="big">
      <a class="bigcard t1" href="/tracker/">${ICON.tracker}<h3>100% tracker</h3><p>Tick off collectibles, missables and trophies. Progress saves on your device.</p><span class="go">Open</span></a>
      <a class="bigcard t2" href="/launch/">${ICON.clock}<h3>When it unlocks</h3><p>Midnight local time. India gets it about 10 hours before the US.</p><span class="go">See times</span></a>
      <a class="bigcard t3" href="/editions/">${ICON.tag}<h3>Which edition?</h3><p>₹5,999 or ₹7,499. What the extra ₹1,500 actually buys you.</p><span class="go">Compare</span></a>
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
    <div class="sec-head"><div><h2>Quick answers</h2></div><a href="/faq/">All questions</a></div>
    <div class="faq">${C.faq.items.slice(0, 4).map((f) => `<details><summary>${esc(f.q)}</summary><p>${esc(f.a)}</p></details>`).join("")}</div>
  </section>
</main>`;
  const script = YT_SCRIPT + `(function(){var t=Date.parse("2026-11-18T18:30:00Z"),a=document.getElementById("unlock");function f(){var l=t-Date.now();if(l<=0){a.textContent="Out now in India";return}var h=Math.floor(l/36e5),m=Math.floor(l%36e5/6e4);a.textContent="Unlocks in India in "+(h?h+"h ":"")+m+"m"}f();setInterval(f,3e4)})();`;
  write("index.html", layout({ url: "/", title: "Home", description: "GTA 6 guide for India and everywhere: unlock times, ₹ prices and editions, characters, every region of Leonida, radio stations, gameplay details and a free 100% completion tracker.", body, script,
    jsonld: { "@context": "https://schema.org", "@type": "WebSite", name: SITE_NAME, url: SITE + "/" } }));
}

// CHARACTERS
{
  const groups = [...new Set(C.characters.items.map((c) => c.group))];
  const body = pageHead([["/", "Home"], [null, "Characters"]], "GTA 6 characters", C.characters.intro) + `<main class="wrap">
  ${groups.map((g) => `<section class="sec"><div class="sec-head"><h2>${esc(g)}</h2></div>${cast(C.characters.items.filter((c) => c.group === g), false)}</section>`).join("")}
  ${sources(C.characters.sources)}</main>`;
  write("characters/index.html", layout({ url: "/characters/", title: "Characters", description: "Every GTA 6 character Rockstar has revealed: Jason Duval, Lucia Caminos, Cal Hampton, Boobie Ike, Raul Bautista and more, with who they are and how they connect.", body, jsonld: breadcrumbLd([["/", "Home"], ["/characters/", "Characters"]]) }));

  C.characters.items.forEach((c, i, arr) => {
    const place = c.place && placeById[c.place];
    const prev = arr[(i - 1 + arr.length) % arr.length], next = arr[(i + 1) % arr.length];
    const conns = (c.connections || []).map((id) => charById[id]).filter(Boolean);
    const body = `<section class="chero">${photo("characters", c.id, poster(c), `${c.name}, official GTA VI image`, { eager: true, focus: c.photoFocus })}<div class="wrap">
      <div class="crumbs"><a href="/">Home</a> / <a href="/characters/">Characters</a> / ${esc(c.name)}</div>
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
      </article>
      <aside class="side">
        <div class="kf"><div><span>Role</span><b>${esc(c.role)}</b></div><div><span>Based in</span><b>${place ? `<a href="/places/${place.id}/">${esc(place.name)}</a>` : "Not stated yet"}</b></div><div><span>Circle</span><b>${esc(c.group)}</b></div><div><span>Revealed</span><b>6 May 2025</b></div></div>
        ${place ? placeCard(place, "s" + i) : ""}
      </aside>
    </div>
    ${conns.length ? `<section class="sec"><div class="sec-head"><div><h2>Connected to</h2><p>The people ${esc(c.name.split(" ")[0])} is tied to.</p></div></div>${cast(conns, true)}</section>` : ""}
    ${gallery("characters", c.id, c.name)}
    <nav class="pager" aria-label="More characters"><a href="/characters/${prev.id}/"><span>Previous</span><b>${esc(prev.name)}</b></a><a class="next" href="/characters/${next.id}/"><span>Next</span><b>${esc(next.name)}</b></a></nav>
    ${sources(C.characters.sources)}</main>`;
    write(`characters/${c.id}/index.html`, layout({ url: `/characters/${c.id}/`, title: `${c.name} in GTA 6`, description: `${c.name} in GTA 6: ${c.summary} Who they are, where they're based and who they're connected to.`, body,
      jsonld: breadcrumbLd([["/", "Home"], ["/characters/", "Characters"], [`/characters/${c.id}/`, c.name]]) }));
  });
}

// PLACES
{
  const body = pageHead([["/", "Home"], [null, "Places"]], "Places in Leonida", C.places.intro) + `<main class="wrap"><section class="sec"><div class="cards">${C.places.items.map(placeCard).join("")}</div></section>${sources(C.places.sources)}</main>`;
  write("places/index.html", layout({ url: "/places/", title: "Places in Leonida", description: "Every GTA 6 region revealed so far: Vice City, Leonida Keys, Grassrivers, Port Gellhorn, Ambrosia and Mount Kalaga National Park, with landmarks and who lives there.", body, jsonld: breadcrumbLd([["/", "Home"], ["/places/", "Places"]]) }));

  C.places.items.forEach((p, i, arr) => {
    const people = C.characters.items.filter((c) => c.place === p.id);
    const prev = arr[(i - 1 + arr.length) % arr.length], next = arr[(i + 1) % arr.length];
    const body = `<section class="phero">${photo("places", p.id, art(p.name, "b" + i), `${p.name}, official GTA VI screenshot`, { eager: true })}<div class="wrap">
      <div class="crumbs"><a href="/">Home</a> / <a href="/places/">Places</a> / ${esc(p.name)}</div>
      ${status("Confirmed")}
      <h1>${esc(p.name)}</h1>
      <p class="say">${esc(p.tagline)}</p>
    </div></section>
    <main class="wrap">
    <div class="detail">
      <article>
        <div class="story">${p.about.map((t) => `<p>${esc(t)}</p>`).join("")}</div>
        ${p.spots.length ? `<section class="sec"><div class="sec-head"><h2>Spots to know</h2></div><ul class="spots">${p.spots.map((s) => `<li><b>${esc(s.name)}</b><span>${esc(s.note)}</span></li>`).join("")}</ul></section>` : ""}
      </article>
      <aside class="side">
        <div class="box"><h2>On the 100% tracker</h2><p style="margin:0 0 12px;color:var(--soft)">Collectibles, activities and missables found in ${esc(p.name)}, added as they're found from launch night.</p><a class="btn primary" href="/tracker/?region=${encodeURIComponent(p.tracker)}">Track ${esc(p.tracker)}</a></div>
        <div class="box"><h2>Status</h2><p style="margin:0;color:var(--soft);font-size:15px">Named and described on Rockstar's official site. Exact map position comes with the game.</p></div>
      </aside>
    </div>
    ${people.length ? `<section class="sec"><div class="sec-head"><h2>Who you'll meet here</h2></div>${cast(people, true)}</section>` : ""}
    ${gallery("places", p.id, p.name)}
    <nav class="pager" aria-label="More places"><a href="/places/${prev.id}/"><span>Previous</span><b>${esc(prev.name)}</b></a><a class="next" href="/places/${next.id}/"><span>Next</span><b>${esc(next.name)}</b></a></nav>
    ${sources(C.places.sources)}</main>`;
    write(`places/${p.id}/index.html`, layout({ url: `/places/${p.id}/`, title: `${p.name} in GTA 6`, description: `${p.name} in GTA 6: ${p.about[0]} Landmarks, characters and what to track there.`, body,
      jsonld: breadcrumbLd([["/", "Home"], ["/places/", "Places"], [`/places/${p.id}/`, p.name]]) }));
  });
}

// RADIO
{
  const eq = (seed) => Array.from({ length: 9 }, (_, i) => `<i style="height:${8 + ((seed * 7 + i * 13) % 22)}px"></i>`).join("");
  const body = pageHead([["/", "Home"], [null, "Radio"]], "GTA 6 radio stations", C.radio.intro) + `<main class="wrap">
  <section class="sec"><div class="dials">${C.radio.stations.map((s, i) => `<article class="dial" id="${s.id}"><div class="top" style="background:linear-gradient(135deg,${s.color},#14112a)"><div><h3>${esc(s.name)}</h3><div class="genre">${esc(s.genre)}</div></div><div class="eq" aria-hidden="true">${eq(i + 1)}</div></div><div class="bot"><p>${esc(s.note)}</p>${s.hosts.map((h) => `<div class="host"><b>${esc(h.name)}</b><span>${h.voice === h.name ? "as themselves" : "voiced by " + esc(h.voice)}</span></div>`).join("")}</div></article>`).join("")}</div></section>
  <section class="sec"><div class="sec-head"><h2>How radio works in GTA 6</h2></div><div class="notes">${C.radio.howItWorks.map((t) => `<div class="note">${esc(t)}</div>`).join("")}</div></section>
  ${sources(C.radio.sources)}</main>`;
  write("radio/index.html", layout({ url: "/radio/", title: "Radio stations", description: "All six GTA 6 radio stations revealed so far, with genres and celebrity hosts: Flash FM, The Chamber 106.6, Cocoteo FM, Dirty South Classics, AfroBank FM and Back Country Radio.", body, jsonld: breadcrumbLd([["/", "Home"], ["/radio/", "Radio"]]) }));
}

// FEATURES
{
  const body = pageHead([["/", "Home"], [null, "Gameplay"]], "How GTA 6 plays", C.features.intro) + `<main class="wrap">
  <div class="legend">${status("Shown")} In official footage or stated by Rockstar ${status("Reported")} From previews or interviews</div>
  ${C.features.groups.map((g) => `<section class="fgroup"><h2>${ICON[g.icon] || ""}${esc(g.name)}</h2><div class="fgrid">${g.items.map((f) => `<div class="feat${f.status === "Reported" ? " rep" : ""}">${status(f.status)}<h3 style="margin-top:8px">${esc(f.title)}</h3><p>${esc(f.text)}</p></div>`).join("")}</div></section>`).join("")}
  ${sources(C.features.sources)}</main>`;
  write("features/index.html", layout({ url: "/features/", title: "Gameplay details", description: "Every confirmed GTA 6 gameplay detail: six wanted stars, switching between Jason and Lucia, combat, activities, phone and social media, and what's been reported from previews.", body, jsonld: breadcrumbLd([["/", "Home"], ["/features/", "Gameplay"]]) }));
}

// EDITIONS
{
  const E = C.editions;
  const types = [...new Set(E.ultimate.map((u) => u.type))];
  const body = pageHead([["/", "Home"], [null, "Editions & prices"]], "Editions and prices", E.intro) + `<main class="wrap">
  <section class="sec"><div class="sec-head"><h2>Prices</h2></div><div class="prices">${E.prices.map((p) => `<div class="price${p.region === "India" ? " in" : ""}"><h3>${esc(p.region)}</h3><div class="p"><span>Standard</span><b>${esc(p.standard)}</b></div><div class="p"><span>Ultimate</span><b>${esc(p.ultimate)}</b></div></div>`).join("")}</div></section>
  <section class="sec"><div class="sec-head"><h2>Standard vs Ultimate</h2></div><div class="tblwrap"><table class="tbl"><thead><tr><th></th><th>Standard</th><th>Ultimate</th></tr></thead><tbody>${E.compare.map((r) => `<tr><td><b>${esc(r.label)}</b></td><td>${esc(r.standard)}</td><td>${esc(r.ultimate)}</td></tr>`).join("")}</tbody></table></div>
    <p class="prose" style="margin-top:14px;color:var(--soft)">Short version: everything Ultimate adds is optional. Cars, weapons, outfits, shops and two side activities, nothing you need to finish the story.</p></section>
  <section class="sec"><div class="sec-head"><div><h2>Vintage Vice City Pack</h2><p>${esc(E.packRules)}</p></div></div><div class="items">${E.pack.map((x) => `<div class="item"><b>${esc(x.name)}</b><p>${esc(x.note)}</p></div>`).join("")}</div></section>
  <section class="sec"><div class="sec-head"><div><h2>What Ultimate adds</h2><p>All ${E.ultimate.length} extras, grouped by type.</p></div></div>
    ${types.map((t) => `<h3 style="margin:18px 0 10px;font-size:18px">${esc(t)}s</h3><div class="items">${E.ultimate.filter((u) => u.type === t).map((x) => `<div class="item"><b>${esc(x.name)}</b><p>${esc(x.note)}</p></div>`).join("")}</div>`).join("")}</section>
  ${sources(E.sources)}</main>`;
  write("editions/index.html", layout({ url: "/editions/", title: "Editions and prices (India, US, UK)", description: "GTA 6 price in India (₹5,999 / ₹7,499), US and UK, Standard vs Ultimate compared, all 16 Ultimate extras and the Vintage Vice City pre-order pack.", body, jsonld: breadcrumbLd([["/", "Home"], ["/editions/", "Editions & prices"]]) }));
}

// LAUNCH
{
  const L = C.launch;
  const body = pageHead([["/", "Home"], [null, "Launch times"]], "GTA 6 launch times", L.intro) + `<main class="wrap">
  <div class="facts" style="margin-top:20px">${L.facts.map((f) => `<div class="fact"><span>${esc(f.label)}</span><b>${esc(f.value)}</b></div>`).join("")}</div>
  <section class="sec"><div class="sec-head"><div><h2>When it unlocks</h2><p>"Your time" uses your device's clock. Want every country with a live countdown? <a href="/countdown/">Open the countdown</a>.</p></div></div>
    <div class="tblwrap"><table class="tbl"><thead><tr><th>Where</th><th>Local time</th><th>India (IST)</th><th>Your time</th></tr></thead><tbody>${L.unlocks.map((u) => `<tr${u.where === "India" ? ' class="me"' : ""}><td><b>${esc(u.where)}</b></td><td>${esc(u.local)}</td><td class="num">${esc(u.ist)}</td><td class="num" data-utc="${u.utc}">–</td></tr>`).join("")}</tbody></table></div></section>
  <section class="sec"><div class="sec-head"><h2>Good to know</h2></div><div class="notes">${L.notes.map((n) => `<div class="note">${esc(n)}</div>`).join("")}</div></section>
  <section class="sec"><div class="sec-head"><div><h2>The road to launch</h2><p>From the first trailer to release day.</p></div></div>
    <ol class="tl">${L.timeline.map((t) => `<li data-date="${t.date}"><time datetime="${t.date}">${fmtDate(t.date)}</time><b>${esc(t.title)}</b><p>${esc(t.text)}</p></li>`).join("")}</ol></section>
  ${sources(L.sources)}</main>`;
  const script = `(function(){var f=new Intl.DateTimeFormat(undefined,{weekday:"short",day:"numeric",month:"short",hour:"numeric",minute:"2-digit"});document.querySelectorAll("[data-utc]").forEach(function(td){td.textContent=f.format(new Date(td.dataset.utc))});var now=Date.now(),marked=false;document.querySelectorAll(".tl li").forEach(function(li){var d=Date.parse(li.dataset.date+"T23:59:59");if(d<now)li.classList.add("past");else if(!marked){li.classList.add("next");marked=true}})})();`;
  write("launch/index.html", layout({ url: "/launch/", title: "Launch times by country (India 12 AM IST)", description: "Exactly when GTA 6 unlocks: 12:00 AM IST on 19 November in India, plus New Zealand, Japan, UK, US and more in your own time, pre-load, install size and the full release timeline.", body, script, jsonld: breadcrumbLd([["/", "Home"], ["/launch/", "Launch times"]]) }));
}

// VIDEOS
{
  const body = pageHead([["/", "Home"], [null, "Videos"]], "GTA 6 trailers and videos", C.videos.intro) + `<main class="wrap"><section class="sec"><div class="vids">${VIDEOS.map(vidCard).join("")}</div></section>${sources(C.videos.sources)}</main>`;
  write("videos/index.html", layout({ url: "/videos/", title: "Trailers and videos", description: "Watch every official GTA 6 video: the Launch Trailer, An Extended Look, Trailer 2, Trailer 1 and the cover art reveal, with dates and what each one shows.", body, script: YT_SCRIPT, jsonld: breadcrumbLd([["/", "Home"], ["/videos/", "Videos"]]) }));
}

// FAQ
{
  const F = C.faq;
  const body = pageHead([["/", "Home"], [null, "FAQ"]], "GTA 6 FAQ", F.intro) + `<main class="wrap"><section class="sec"><div class="faq">${F.items.map((f, i) => `<details${i < 2 ? " open" : ""}><summary>${esc(f.q)}</summary><p>${esc(f.a)}${f.link ? ` <a href="${f.link}">More</a>` : ""}</p></details>`).join("")}</div></section></main>`;
  write("faq/index.html", layout({ url: "/faq/", title: "FAQ", description: "Answers to the most asked GTA 6 questions: India unlock time and price, PC, online mode, physical disc, pre-order bonus, download size, cheats and more.", body,
    jsonld: { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: F.items.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) } }));
}

// ABOUT
{
  const body = pageHead([["/", "Home"], [null, "About"]], "About this site", "A free, fan-made GTA 6 guide built by a player in India.") + `<main class="wrap"><section class="sec prose">
  <p>Everything before launch comes from Rockstar's official material: the GTA VI website, trailers, the Extended Look and Newswire posts. Each page lists its sources, and anything that comes from previews or interviews is marked "Reported".</p>
  <p>From launch night, the 100% tracker is filled in from real play. Items are only added once they've been seen in the game. Nothing here comes from leaks.</p>
  <p>All writing and illustrations are original. No Rockstar artwork, logos or screenshots are used.</p>
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
write("tracker/index.html", fs.readFileSync(path.join(ROOT, "src/tracker.html"), "utf8"));
pages.push("/tracker/");
write("countdown/index.html", fs.readFileSync(path.join(ROOT, "src/countdown.html"), "utf8"));
pages.push("/countdown/");

const today = new Date().toISOString().slice(0, 10);
write("sitemap.xml", `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${pages.map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}\n</urlset>\n`);
write("robots.txt", `User-agent: *\nDisallow: /edit\nSitemap: ${SITE}/sitemap.xml\n`);

console.log(`Built ${pages.length} pages into dist/`);
