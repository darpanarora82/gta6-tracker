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

  for (let attempt = 0; attempt < 2; attempt++) {
    const ref = await ghJson(env, "/git/ref/heads/main");
    const head = ref.object.sha;
    const commit = await ghJson(env, `/git/commits/${head}`);
    const file = await ghJson(env, `/contents/data.json?ref=${head}`);
    const data = JSON.parse(b64ToText(file.content));
    const taken = new Set(data.categories.flatMap((c) => (c.items || []).map((i) => i.id)));
    const today = new Date().toISOString().slice(0, 10);
    const tree = [], ids = [];

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
      if (/^[0-9a-f]{40}$/.test(d.imgBlob || "")) { tree.push({ path: `src/assets/img/items/${id}.jpg`, mode: "100644", type: "blob", sha: d.imgBlob }); it.img = `/assets/img/items/${id}.jpg`; }
      if (/^[0-9a-f]{40}$/.test(d.thumbBlob || "")) { tree.push({ path: `src/assets/img/items/${id}-t.jpg`, mode: "100644", type: "blob", sha: d.thumbBlob }); it.thumb = `/assets/img/items/${id}-t.jpg`; }
      it.added = /^\d{4}-\d{2}-\d{2}$/.test(d.added || "") ? d.added : today;
      (cat.items = cat.items || []).push(it);
      ids.push(id);
    }
    if (!ids.length) return json({ ok: false, error: "Nothing valid to publish" }, 400);
    data.updated = today;

    const blob = await ghJson(env, "/git/blobs", { method: "POST", body: JSON.stringify({ content: JSON.stringify(data, null, 2) + "\n", encoding: "utf-8" }) });
    tree.push({ path: "data.json", mode: "100644", type: "blob", sha: blob.sha });
    const newTree = await ghJson(env, "/git/trees", { method: "POST", body: JSON.stringify({ base_tree: commit.tree.sha, tree }) });
    const newCommit = await ghJson(env, "/git/commits", { method: "POST", body: JSON.stringify({ message: `Tracker: add ${ids.join(", ")}`, tree: newTree.sha, parents: [head] }) });
    const move = await gh(env, "/git/refs/heads/main", { method: "PATCH", body: JSON.stringify({ sha: newCommit.sha }) });
    if (move.ok) return json({ ok: true, ids });
    if (move.status !== 422) throw new Error(`GitHub ${move.status}: couldn't update main`);
    // main moved while we were working (someone else pushed): start again on top of it
  }
  return json({ ok: false, error: "The site changed while publishing. Try again." }, 409);
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
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (p !== "/edit" && !p.startsWith("/edit/")) return env.ASSETS.fetch(request);
    if (!env.EDIT_PASSWORD) return denied("Editor is locked: add the EDIT_PASSWORD secret in Cloudflare.");
    if (!authorised(request, env)) return denied("Sign in to use the editor.");

    if (request.method === "POST" && p === "/edit/draft") {
      if (!env.AI) return json({ ok: false, error: "AI isn't connected to this Worker." }, 500);
      try { return await draft(request, env); } catch (e) { return json({ ok: false, error: "AI error: " + (e.message || e) }, 502); }
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

    if (p === "/edit" || p === "/edit/") {
      // Signed in: serve the tracker page. It switches to edit mode because the path is /edit.
      const page = await env.ASSETS.fetch(new Request(new URL("/tracker/", url), request));
      return new Response(page.body, { status: page.status, headers: { "Content-Type": "text/html; charset=utf-8", ...NO_STORE } });
    }
    return json({ ok: false, error: "Not found" }, 404);
  },
};
