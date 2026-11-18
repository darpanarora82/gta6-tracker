// Cloudflare Worker for the GTA 6 Guide.
// Static files in ./dist are served by Cloudflare directly (free and unlimited).
// This script only runs for /edit and /edit/*:
//   /edit           password-protected tracker editor
//   /edit/blob      uploads one photo to GitHub (streamed straight through)
//   /edit/publish   commits new tracker items (and their photos) to GitHub in one commit
//   /edit/draft     asks Workers AI (free daily allowance) to draft an item from a screenshot + hint
// Secrets (Cloudflare → Settings → Variables and Secrets, type Secret):
//   EDIT_PASSWORD   password for the editor
//   GITHUB_TOKEN    fine-grained GitHub token with Contents: read and write on this repo only
// Plain variable in wrangler.jsonc: GITHUB_REPO = "owner/repo".

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}
const NO_STORE = { "Cache-Control": "no-store", "X-Robots-Tag": "noindex" };
function denied(message) {
  return new Response(message, { status: 401, headers: { "WWW-Authenticate": 'Basic realm="Tracker editor", charset="UTF-8"', ...NO_STORE } });
}
const json = (data, status = 200) => new Response(JSON.stringify(data), { status, headers: { "Content-Type": "application/json", ...NO_STORE } });

function authorised(request, env) {
  if (!env.EDIT_PASSWORD) return false;
  const [scheme, encoded] = (request.headers.get("authorization") || "").split(" ");
  if (scheme !== "Basic" || !encoded) return false;
  try { const d = atob(encoded); return safeEqual(d.slice(d.indexOf(":") + 1), env.EDIT_PASSWORD); } catch { return false; }
}

function gh(env, path, init = {}) {
  return fetch(`https://api.github.com/repos/${env.GITHUB_REPO}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${env.GITHUB_TOKEN}`, Accept: "application/vnd.github+json", "User-Agent": "gta6-guide-editor", "X-GitHub-Api-Version": "2022-11-28", ...(init.headers || {}) },
  });
}
async function ghJson(env, path, init) {
  const r = await gh(env, path, init);
  const body = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(`GitHub ${r.status}: ${body.message || "request failed"}`);
  return body;
}

const clean = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
const b64ToText = (b64) => new TextDecoder().decode(Uint8Array.from(atob(b64.replace(/\n/g, "")), (c) => c.charCodeAt(0)));

async function publish(request, env) {
  const { items } = await request.json();
  if (!Array.isArray(items) || !items.length || items.length > 100) return json({ ok: false, error: "No items to publish" }, 400);
  const r = await publishItems(env, items);
  return r.error ? json({ ok: false, error: r.error }, r.status || 400) : json({ ok: true, ids: r.ids, names: r.names });
}

async function publishItems(env, items) {

  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await ghJson(env, "/git/ref/heads/main");
    const head = ref.object.sha;
    const commit = await ghJson(env, `/git/commits/${head}`);
    const file = await ghJson(env, `/contents/data.json?ref=${head}`);
    const data = JSON.parse(b64ToText(file.content));
    const taken = new Set(data.categories.flatMap((c) => (c.items || []).map((i) => i.id)));
    const today = new Date().toISOString().slice(0, 10);
    const tree = [], ids = [], names = [];

    for (const d of items) {
      const cat = data.categories.find((c) => c.id === d.cat);
      const name = clean(d.name, 200);
      if (!cat || !name) continue;
      let id = clean(d.id, 40);
      if (!new RegExp(`^${cat.id}-\\d{3,}$`).test(id) || taken.has(id)) {
        let n = 1; while (taken.has(`${cat.id}-${String(n).padStart(3, "0")}`)) n++;
        id = `${cat.id}-${String(n).padStart(3, "0")}`;
      }
      taken.add(id);
      const it = { id, name };
      const region = clean(d.region, 60), note = clean(d.note, 1200);
      if (region && (data.regions || []).includes(region)) it.region = region;
      if (note) it.note = note;
      if (d.missable) it.missable = true;
      if (d.spoiler) it.spoiler = true;
      const by = clean(d.by, 40); if (by) it.by = by;
      if (Array.isArray(d.pos) && d.pos.length === 2 && d.pos.every((n) => Number.isFinite(n) && Math.abs(n) <= 16384)) it.pos = d.pos.map(Math.round);
      if (/^[0-9a-f]{40}$/.test(d.imgBlob || "")) { tree.push({ path: `src/assets/img/items/${id}.jpg`, mode: "100644", type: "blob", sha: d.imgBlob }); it.img = `/assets/img/items/${id}.jpg`; }
      if (/^[0-9a-f]{40}$/.test(d.thumbBlob || "")) { tree.push({ path: `src/assets/img/items/${id}-t.jpg`, mode: "100644", type: "blob", sha: d.thumbBlob }); it.thumb = `/assets/img/items/${id}-t.jpg`; }
      it.added = /^\d{4}-\d{2}-\d{2}$/.test(d.added || "") ? d.added : today;
      (cat.items = cat.items || []).push(it);
      ids.push(id); names.push(name);
    }
    if (!ids.length) return { error: "Nothing valid to publish", status: 400 };
    data.updated = today;

    const blob = await ghJson(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: JSON.stringify(data, null, 2) + "\n", encoding: "utf-8" }) });
    tree.push({ path: "data.json", mode: "100644", type: "blob", sha: blob.sha });
    const newTree = await ghJson(env, "/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
    const newCommit = await ghJson(env, "/git/commits", { method: "POST", body: JSON.stringify({ message: `Tracker: add ${ids.join(", ")}`, tree: newTree.sha, parents: [head] }) });
    const move = await gh(env, "/git/refs/heads/main", { method: "PATCH", body: JSON.stringify({ sha: newCommit.sha }) });
    if (move.ok) return { ids, names };
    if (move.status !== 422) throw new Error(`GitHub ${move.status}: couldn't update main`);
    // main moved while we were working (someone else pushed): start again on top of it
  }
  return { error: "The site changed while publishing. Try again.", status: 409 };
}


/* ---------- trophies from PlayStation ----------
   Uses the owner's NPSSO token (Cloudflare secret PSN_NPSSO) to read the official trophy list:
   names, Rockstar's one-line requirement, grade, hidden flag and how many players have each one.
   Trophy IDs are fixed from PlayStation's own numbering (trophies-001 is PSN trophy 0), so
   re-importing updates the same items and never touches our tips, regions or photos. */
const PSN_AUTH = "https://ca.account.sony.com/api/authz/v3/oauth";
const PSN_TROPHY = "https://m.np.playstation.com/api/trophy";
const PSN_REDIRECT = "com.scee.psxandroid.scecompcall://redirect";
const GTA6 = /grand theft auto vi\b|\bgta vi\b|\bgta 6\b/i;
const GRADES = ["platinum", "gold", "silver", "bronze"];

class PsnError extends Error {}

async function psnToken(env) {
  if (!env.PSN_NPSSO) throw new PsnError("Add your PlayStation token as the Cloudflare secret PSN_NPSSO first.");
  const q = new URLSearchParams({ access_type: "offline", client_id: "09515159-7237-4370-9b40-3806e67c0891", redirect_uri: PSN_REDIRECT, response_type: "code", scope: "psn:mobile.v2.core psn:clientapp" });
  const a = await fetch(`${PSN_AUTH}/authorize?${q}`, { headers: { Cookie: `npsso=${env.PSN_NPSSO}` }, redirect: "manual" });
  const loc = a.headers.get("location") || "";
  const code = loc.includes("?code=") ? new URLSearchParams(loc.split("redirect/")[1] || loc.split("?")[1]).get("code") : null;
  if (!code) throw new PsnError("PlayStation sign-in failed. Your PSN_NPSSO token has probably expired: get a fresh one and update the secret.");
  const t = await fetch(`${PSN_AUTH}/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic MDk1MTUxNTktNzIzNy00MzcwLTliNDAtMzgwNmU2N2MwODkxOnVjUGprYTV0bnRCMktxc1A=" },
    body: new URLSearchParams({ code, redirect_uri: PSN_REDIRECT, grant_type: "authorization_code", token_format: "jwt" }),
  });
  const j = await t.json().catch(() => ({}));
  if (!j.access_token) throw new PsnError("PlayStation sign-in failed at the token step. Try again in a minute.");
  return j.access_token;
}

async function psnGet(token, path) {
  const r = await fetch(PSN_TROPHY + path, { headers: { Authorization: `Bearer ${token}`, "Accept-Language": "en-US" } });
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw new PsnError(`PlayStation said ${r.status}: ${(j.error && j.error.message) || "request failed"}`);
  return j;
}

async function findGta6(token) {
  const j = await psnGet(token, "/v1/users/me/trophyTitles?limit=800");
  return (j.trophyTitles || []).filter((t) => GTA6.test(t.trophyTitleName || "")).map((t) => {
    const c = t.definedTrophies || {};
    return { id: t.npCommunicationId, name: t.trophyTitleName, platform: t.trophyTitlePlatform, service: t.npServiceName, total: (c.platinum || 0) + (c.gold || 0) + (c.silver || 0) + (c.bronze || 0) };
  });
}

// Reads the trophy list and writes it into data.json. Returns { changed, added, updated, ids, names }.
async function importTrophies(env, titleId, service) {
  const token = await psnToken(env);
  const svc = service === "trophy" ? "trophy" : "trophy2";
  const list = (await psnGet(token, `/v1/npCommunicationIds/${titleId}/trophyGroups/all/trophies?npServiceName=${svc}`)).trophies || [];
  if (!list.length) throw new PsnError("PlayStation returned an empty trophy list for this game.");
  const rate = {};
  try {
    const mine = await psnGet(token, `/v1/users/me/npCommunicationIds/${titleId}/trophyGroups/all/trophies?npServiceName=${svc}`);
    (mine.trophies || []).forEach((t) => { if (t.trophyEarnedRate != null) rate[t.trophyId] = String(t.trophyEarnedRate); });
  } catch { /* rarity is optional */ }

  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await ghJson(env, "/git/ref/heads/main");
    const head = ref.object.sha;
    const commit = await ghJson(env, `/git/commits/${head}`);
    const file = await ghJson(env, `/contents/data.json?ref=${head}`);
    const data = JSON.parse(b64ToText(file.content));
    const cat = data.categories.find((c) => c.id === "trophies");
    if (!cat) throw new PsnError("data.json has no trophies category.");
    const before = JSON.stringify(cat);
    const today = new Date().toISOString().slice(0, 10);
    const byId = new Map((cat.items || []).map((i) => [i.id, i]));
    const fromPsn = [], added = [], names = [];
    for (const t of list) {
      const id = `trophies-${String(t.trophyId + 1).padStart(3, "0")}`;
      const old = byId.get(id);
      const it = old || { id };
      it.name = clean(t.trophyName, 120) || it.name || `Trophy ${t.trophyId + 1}`;
      const desc = clean(t.trophyDetail, 400); if (desc) it.desc = desc;
      if (GRADES.includes(t.trophyType)) it.grade = t.trophyType;
      if (rate[t.trophyId] != null) it.rarity = rate[t.trophyId];
      it.psn = t.trophyId;
      if (!old) { if (t.trophyHidden) it.spoiler = true; it.added = today; added.push(id); names.push(it.name); }
      byId.delete(id);
      fromPsn.push(it);
    }
    // Trophies in PlayStation's order first (platinum leads), then anything we added by hand.
    cat.items = fromPsn.concat([...byId.values()]);
    cat.psnTitle = titleId; cat.psnService = svc;
    if (JSON.stringify(cat) === before) return { changed: false, added: [], updated: 0, ids: [], names: [] };
    data.updated = today;
    const blob = await ghJson(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: JSON.stringify(data, null, 2) + "\n", encoding: "utf-8" }) });
    const newTree = await ghJson(env, "/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree: [{ path: "data.json", mode: "100644", type: "blob", sha: blob.sha }] }) });
    const msg = added.length ? `Trophies: import ${list.length} from PlayStation (${added.length} new)` : `Trophies: refresh rarity from PlayStation`;
    const newCommit = await ghJson(env, "/git/commits", { method: "POST", body: JSON.stringify({ message: msg, tree: newTree.sha, parents: [head] }) });
    const move = await gh(env, "/git/refs/heads/main", { method: "PATCH", body: JSON.stringify({ sha: newCommit.sha }) });
    if (move.ok) return { changed: true, added, updated: list.length - added.length, ids: added, names };
    if (move.status !== 422) throw new Error(`GitHub ${move.status}: couldn't update main`);
  }
  throw new Error("The site changed while importing. Try again.");
}

async function trophies(request, env) {
  const { action, id, service } = await request.json().catch(() => ({}));
  if (action === "check") {
    const token = await psnToken(env);
    const found = await findGta6(token);
    if (!found.length) return json({ ok: true, found: [], message: "GTA 6 isn't in this PlayStation account's trophy list yet. Start the game once on your PS5, then check again." });
    return json({ ok: true, found });
  }
  if (action === "import") {
    if (!/^NPWR\d{5}_\d{2}$/.test(id || "")) return json({ ok: false, error: "Check for the trophy list first." }, 400);
    return json({ ok: true, ...(await importTrophies(env, id, service)) });
  }
  return json({ ok: false, error: "Unknown action" }, 400);
}

/* ---------- news feed ----------
   Every hour: Rockstar's YouTube uploads about GTA VI + Google News headlines for "GTA 6".
   Only headline, source, date and link are kept (no article text). Writes content/news.json. */
const YT_FEED = "https://www.youtube.com/feeds/videos.xml?channel_id=UC6VcWc1rAoWdBCM0JxrRQ3A";
const GN_FEED = "https://news.google.com/rss/search?q=%22GTA%206%22%20OR%20%22GTA%20VI%22%20OR%20%22Grand%20Theft%20Auto%20VI%22&hl=en-US&gl=US&ceid=US:en";
const xmlText = (s) => String(s || "").replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&#39;|&apos;/g, "'").replace(/&#(\d+);/g, (_, n) => String.fromCharCode(+n)).replace(/&amp;/g, "&").trim();
const tag = (block, name) => { const m = block.match(new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`)); return m ? xmlText(m[1]) : ""; };

async function fetchNews() {
  const out = [];
  const get = (u) => fetch(u, { headers: { "User-Agent": "trackgta6.com news (+https://trackgta6.com)" }, cf: { cacheTtl: 600 } }).then((r) => (r.ok ? r.text() : ""));
  const [yt, gn] = await Promise.all([get(YT_FEED).catch(() => ""), get(GN_FEED).catch(() => "")]);
  for (const e of yt.split("<entry>").slice(1)) {
    const id = tag(e, "yt:videoId"), title = tag(e, "title");
    if (!id || !/grand theft auto vi\b|\bgta vi\b|\bgta 6\b/i.test(title)) continue;
    out.push({ kind: "video", id: "yt-" + id, title: clean(title, 160), source: "Rockstar Games on YouTube", url: `https://www.youtube.com/watch?v=${id}`, video: id, date: tag(e, "published") });
  }
  for (const it of gn.split("<item>").slice(1).slice(0, 40)) {
    const src = tag(it, "source"); let title = tag(it, "title"); const link = tag(it, "link");
    if (src && title.endsWith(" - " + src)) title = title.slice(0, -(src.length + 3));
    if (!title || !/^https:\/\//.test(link)) continue;
    const official = /rockstar/i.test(src);
    out.push({ kind: official ? "official" : "news", id: "gn-" + tag(it, "guid").slice(-24), title: clean(title, 160), source: clean(src, 60), url: link, date: new Date(tag(it, "pubDate") || Date.now()).toISOString() });
  }
  return out;
}

async function commitFile(env, filePath, build, message) {
  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await ghJson(env, "/git/ref/heads/main");
    const head = ref.object.sha;
    const commit = await ghJson(env, `/git/commits/${head}`);
    const cur = await gh(env, `/contents/${filePath}?ref=${head}`);
    const old = cur.ok ? b64ToText((await cur.json()).content) : null;
    const next = build(old);
    if (next == null || next === old) return false;
    const blob = await ghJson(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: next, encoding: "utf-8" }) });
    const tree = await ghJson(env, "/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree: [{ path: filePath, mode: "100644", type: "blob", sha: blob.sha }] }) });
    const c = await ghJson(env, "/git/commits", { method: "POST", body: JSON.stringify({ message, tree: tree.sha, parents: [head] }) });
    const move = await gh(env, "/git/refs/heads/main", { method: "PATCH", body: JSON.stringify({ sha: c.sha }) });
    if (move.ok) return true;
    if (move.status !== 422) throw new Error(`GitHub ${move.status}: couldn't update main`);
  }
  return false;
}

async function updateNews(env) {
  const fresh = await fetchNews();
  if (!fresh.length) return { changed: false, count: 0 };
  let added = 0;
  const changed = await commitFile(env, "content/news.json", (old) => {
    const cur = old ? JSON.parse(old) : { items: [] };
    const byUrl = new Map(cur.items.map((i) => [i.url, i]));
    const seenTitle = new Set(cur.items.map((i) => i.title.toLowerCase()));
    const seenAt = new Date().toISOString();
    for (const n of fresh) { if (!byUrl.has(n.url) && !seenTitle.has(n.title.toLowerCase())) { n.seen = seenAt; byUrl.set(n.url, n); seenTitle.add(n.title.toLowerCase()); added++; } }
    if (!added) return null;
    const items = [...byUrl.values()].sort((a, b) => (b.date || "").localeCompare(a.date || "")).slice(0, 80);
    return JSON.stringify({ updated: new Date().toISOString(), items }, null, 2) + "\n";
  }, "News: update feed");
  return { changed, count: added };
}

// Move pins: [{id, pos:[x,y]}] -> update data.json in one commit.
async function movePins(request, env) {
  const { moves } = await request.json().catch(() => ({}));
  if (!Array.isArray(moves) || !moves.length || moves.length > 200) return json({ ok: false, error: "No pin changes" }, 400);
  const ok = (p) => Array.isArray(p) && p.length === 2 && p.every((n) => Number.isFinite(n) && Math.abs(n) <= 16384);
  let count = 0;
  await commitFile(env, "data.json", (old) => {
    const data = JSON.parse(old); count = 0;
    const byId = new Map(data.categories.flatMap((c) => (c.items || []).map((i) => [i.id, i])));
    for (const m of moves) { const it = byId.get(m.id); if (it && ok(m.pos)) { it.pos = m.pos.map(Math.round); count++; } }
    if (!count) return null;
    data.updated = new Date().toISOString().slice(0, 10);
    return JSON.stringify(data, null, 2) + "\n";
  }, `Tracker: move ${moves.length} pin${moves.length === 1 ? "" : "s"} on the map`);
  return json({ ok: true, count });
}

/* ---------- visitor suggestions ----------
   Public form -> Turnstile check -> D1 table "subs" (status pending). The owner approves (publishes it as a
   tracker item, photo included) or rejects from /edit. Raw IPs are never stored: only a daily salted hash for rate limits. */
const SUB_LIMIT_PER_DAY = 8;
const dataUrlOk = (s, max) => typeof s === "string" && /^data:image\/jpeg;base64,[A-Za-z0-9+/=]+$/.test(s) && s.length <= max;
async function sha(text) { const b = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text)); return [...new Uint8Array(b)].map((x) => x.toString(16).padStart(2, "0")).join(""); }

async function suggest(request, env) {
  if (!env.SUBS || !env.TURNSTILE_SECRET) return json({ ok: false, error: "Suggestions aren't switched on yet." }, 503);
  if (+(request.headers.get("content-length") || 0) > 900000) return json({ ok: false, error: "That photo is too big." }, 413);
  const b = await request.json().catch(() => ({}));
  const ip = request.headers.get("cf-connecting-ip") || "";
  const tv = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", { method: "POST", body: new URLSearchParams({ secret: env.TURNSTILE_SECRET, response: String(b.token || ""), remoteip: ip }) }).then((r) => r.json()).catch(() => ({}));
  if (!tv.success) return json({ ok: false, error: "The robot check didn't pass. Please try again." }, 400);
  const data = await env.ASSETS.fetch(new Request(new URL("/data.json", request.url))).then((r) => r.json());
  const cats = (data.categories || []).map((c) => c.id), regions = data.regions || [];
  const name = clean(b.name, 120), note = clean(b.note, 800), cat = cats.includes(b.cat) ? b.cat : "";
  if (name.length < 3 || !cat) return json({ ok: false, error: "Add a name and pick a category." }, 400);
  const pos = Array.isArray(b.pos) && b.pos.length === 2 && b.pos.every((n) => Number.isFinite(n) && Math.abs(n) <= 16384) ? JSON.stringify(b.pos.map(Math.round)) : null;
  const img = dataUrlOk(b.img, 600000) ? b.img : null, thumb = img && dataUrlOk(b.thumb, 120000) ? b.thumb : null;
  const day = new Date().toISOString().slice(0, 10), who = await sha(ip + "|" + day + "|" + env.TURNSTILE_SECRET.slice(0, 8));
  const n = await env.SUBS.prepare("SELECT COUNT(*) AS n FROM subs WHERE who = ?1").bind(who).first("n");
  if (n >= SUB_LIMIT_PER_DAY) return json({ ok: false, error: "Thanks! That's the daily limit for suggestions from you. Try again tomorrow." }, 429);
  await env.SUBS.prepare("INSERT INTO subs (created, cat, name, region, note, missable, spoiler, pos, img, thumb, credit, who) VALUES (?1,?2,?3,?4,?5,?6,?7,?8,?9,?10,?11,?12)")
    .bind(new Date().toISOString(), cat, name, regions.includes(b.region) ? b.region : "", note, b.missable ? 1 : 0, b.spoiler || cat === "story" ? 1 : 0, pos, img, thumb, clean(b.credit, 40), who).run();
  return json({ ok: true });
}

async function listSubs(env) {
  const r = await env.SUBS.prepare("SELECT id, created, cat, name, region, note, missable, spoiler, pos, thumb, credit, (img IS NOT NULL) AS hasImg FROM subs WHERE status = 'pending' ORDER BY created LIMIT 60").all();
  return json({ ok: true, subs: (r.results || []).map((s) => ({ ...s, pos: s.pos ? JSON.parse(s.pos) : null })) });
}

async function decideSub(request, env) {
  const { id, action, item } = await request.json().catch(() => ({}));
  const row = await env.SUBS.prepare("SELECT * FROM subs WHERE id = ?1 AND status = 'pending'").bind(+id).first();
  if (!row) return json({ ok: false, error: "That suggestion was already handled." }, 404);
  const now = new Date().toISOString();
  if (action === "reject") {
    await env.SUBS.prepare("UPDATE subs SET status = 'rejected', decided = ?2, img = NULL, thumb = NULL WHERE id = ?1").bind(row.id, now).run();
    return json({ ok: true });
  }
  if (action !== "approve") return json({ ok: false, error: "Unknown action" }, 400);
  const e = item || {};
  const blob = async (dataUrl) => { if (!dataUrl) return null; const r = await ghJson(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: dataUrl.slice(dataUrl.indexOf(",") + 1), encoding: "base64" }) }); return r.sha; };
  const x = { id: "", cat: e.cat || row.cat, name: e.name || row.name, region: e.region ?? row.region, note: e.note ?? row.note, missable: e.missable ?? !!row.missable, spoiler: e.spoiler ?? !!row.spoiler,
    pos: row.pos ? JSON.parse(row.pos) : null, by: e.by ?? row.credit, added: now.slice(0, 10), imgBlob: await blob(row.img), thumbBlob: await blob(row.thumb) };
  const r = await publishItems(env, [x]);
  if (r.error) return json({ ok: false, error: r.error }, r.status || 400);
  await env.SUBS.prepare("UPDATE subs SET status = 'approved', decided = ?2, item_id = ?3, img = NULL, thumb = NULL WHERE id = ?1").bind(row.id, now, r.ids[0]).run();
  return json({ ok: true, ids: r.ids, names: r.names });
}

const VISION = "@cf/meta/llama-3.2-11b-vision-instruct";
async function draft(request, env) {
  const { image, hint, categories, regions } = await request.json();
  if (typeof image !== "string" || !image.startsWith("data:image/")) return json({ ok: false, error: "Send a screenshot" }, 400);
  const cats = (categories || []).map((c) => `- ${c.id}: ${c.name}${c.desc ? " – " + c.desc : ""}`).join("\n");
  const system = `You help write a GTA 6 100% completion tracker. From a game screenshot and the player's short hint, draft ONE tracker item.
Reply with JSON only, no other text:
{"name": "...", "category": "...", "region": "...", "note": "...", "missable": false, "spoiler": false, "regionSure": true}
Rules:
- name: short and specific, max 60 characters, like "Jacket from the stranger" or "#3 – under the north pier". No full sentences.
- category: one of these ids:
${cats}
- region: exactly one of ${JSON.stringify(regions || [])}, or "" if unknown. Use the hint first. Set regionSure to false if you are guessing.
- note: 1-2 plain sentences telling another player how to find or complete it. Use the hint's facts; add only what the screenshot clearly shows. Never invent map locations, and don't name a region in the note unless the hint names it.
- missable: true only if the hint says it can be missed for good.
- spoiler: true if it names a mission, a story event or a character twist. Collectibles and general activities are not spoilers.`;
  const run = () => env.AI.run(VISION, { messages: [{ role: "system", content: system }, { role: "user", content: `Player's hint: ${clean(hint, 500) || "(none)"}` }], image, max_tokens: 300, temperature: 0.2 });
  let out;
  try { out = await run(); } catch (e) {
    const m = String(e && e.message || e);
    if (/agree|licen[cs]e/i.test(m)) return json({ ok: false, error: "The AI model's licence hasn't been accepted for this account yet." }, 503);
    if (/neuron|limit|quota|429|4006/i.test(m)) return json({ ok: false, error: "Today's free AI allowance is used up. It resets at 05:30 IST." }, 429);
    throw e;
  }
  // Workers AI may return the answer already parsed into an object, or as text containing JSON.
  const raw = out && (out.response ?? out.result?.response);
  let d = {};
  if (raw && typeof raw === "object") d = raw;
  else { const m = String(raw || "").match(/\{[\s\S]*\}/); try { d = m ? JSON.parse(m[0]) : {}; } catch { d = {}; } }
  const catIds = (categories || []).map((c) => c.id);
  const res = {
    name: clean(d.name, 80),
    cat: catIds.includes(d.category) ? d.category : "",
    region: (regions || []).includes(d.region) ? d.region : "",
    note: clean(d.note, 600),
    missable: d.missable === true,
    spoiler: d.spoiler === true,
    // Only trust the region if the player's hint actually names it; the model guesses confidently.
    regionSure: (regions || []).includes(d.region) && String(hint || "").toLowerCase().includes(String(d.region).toLowerCase()),
  };
  if (!res.name && !res.note) return json({ ok: false, error: "The AI couldn't read this one. Fill it in by hand." }, 502);
  return json({ ok: true, draft: res });
}

export default {
  // Once a day: refresh "x% of players" for every trophy, if the list has been imported.
  async scheduled(event, env, ctx) {
    if (!env.GITHUB_TOKEN) return;
    if (event.cron === "17 * * * *") { ctx.waitUntil(updateNews(env)); return; }
    if (!env.PSN_NPSSO) return;
    ctx.waitUntil((async () => {
      const r = await env.ASSETS.fetch(new Request("https://trackgta6.com/data.json"));
      const data = await r.json();
      const cat = (data.categories || []).find((c) => c.id === "trophies");
      if (cat && cat.psnTitle) await importTrophies(env, cat.psnTitle, cat.psnService);
    })());
  },

  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (p === "/api/suggest" && request.method === "POST") {
      try { return await suggest(request, env); } catch (e) { return json({ ok: false, error: "Couldn't save that. Please try again." }, 500); }
    }
    if (p !== "/edit" && !p.startsWith("/edit/")) return env.ASSETS.fetch(request);
    if (!env.EDIT_PASSWORD) return denied("Editor is locked: add the EDIT_PASSWORD secret in Cloudflare.");
    if (!authorised(request, env)) return denied("Sign in to use the editor.");

    if (request.method === "POST" && p === "/edit/draft") {
      if (!env.AI) return json({ ok: false, error: "AI isn't connected to this Worker." }, 500);
      try { return await draft(request, env); } catch (e) { return json({ ok: false, error: "AI error: " + (e.message || e) }, 502); }
    }
    if (p === "/edit/subs") {
      if (!env.SUBS) return json({ ok: false, error: "Suggestions database isn't connected." }, 500);
      try { return request.method === "POST" ? await decideSub(request, env) : await listSubs(env); } catch (e) { return json({ ok: false, error: e.message }, 502); }
    }
    if (request.method === "POST" && p === "/edit/move") {
      if (!env.GITHUB_TOKEN) return json({ ok: false, error: "Publishing isn't set up." }, 500);
      try { return await movePins(request, env); } catch (e) { return json({ ok: false, error: e.message }, 502); }
    }
    if (request.method === "POST" && p === "/edit/news") {
      if (!env.GITHUB_TOKEN) return json({ ok: false, error: "Publishing isn't set up." }, 500);
      try { return json({ ok: true, ...(await updateNews(env)) }); } catch (e) { return json({ ok: false, error: "News update failed: " + (e.message || e) }, 502); }
    }
    if (request.method === "POST" && p === "/edit/trophies") {
      if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json({ ok: false, error: "Publishing isn't set up: add the GITHUB_TOKEN secret in Cloudflare." }, 500);
      try { return await trophies(request, env); }
      catch (e) { return json({ ok: false, error: e instanceof PsnError ? e.message : "Import failed: " + (e.message || e) }, 502); }
    }
    if (request.method === "POST" && (p === "/edit/blob" || p === "/edit/publish")) {
      if (!env.GITHUB_TOKEN || !env.GITHUB_REPO) return json({ ok: false, error: "Publishing isn't set up: add the GITHUB_TOKEN secret in Cloudflare." }, 500);
      try {
        if (p === "/edit/blob") {
          // Body is already GitHub's blob JSON ({content, encoding:"base64"}); stream it through without parsing.
          const r = await gh(env, "/git/blobs", { method: "POST", body: request.body, headers: { "Content-Type": "application/json" } });
          const b = await r.json().catch(() => ({}));
          return r.ok ? json({ ok: true, sha: b.sha }) : json({ ok: false, error: `GitHub ${r.status}: ${b.message || "upload failed"}` }, 502);
        }
        return await publish(request, env);
      } catch (e) {
        return json({ ok: false, error: e.message }, 502);
      }
    }

    if (p === "/edit/map" || p === "/edit/map/") {
      // Signed in: the public map page; map.js switches to editor mode on this path.
      const page = await env.ASSETS.fetch(new Request(new URL("/map/", url), request));
      return new Response(page.body, { status: page.status, headers: { "Content-Type": "text/html; charset=utf-8", ...NO_STORE } });
    }
    if (p === "/edit" || p === "/edit/") {
      // Signed in: serve the tracker page. It switches to edit mode because the path is /edit.
      const page = await env.ASSETS.fetch(new Request(new URL("/tracker/", url), request));
      return new Response(page.body, { status: page.status, headers: { "Content-Type": "text/html; charset=utf-8", ...NO_STORE } });
    }
    return json({ ok: false, error: "Not found" }, 404);
  },
};
