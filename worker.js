// Cloudflare Worker for the GTA 6 Guide.
// Static files in ./dist are served by Cloudflare directly (free and unlimited).
// This script only runs for /edit, where it password-protects the tracker editor.
// Set the password in Cloudflare: Workers & Pages → this project → Settings → Variables and Secrets → add a Secret named EDIT_PASSWORD.

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function denied(message) {
  return new Response(message, {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="Tracker editor", charset="UTF-8"', "Cache-Control": "no-store", "X-Robots-Tag": "noindex" },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname !== "/edit" && url.pathname !== "/edit/") return env.ASSETS.fetch(request);

    const password = env.EDIT_PASSWORD;
    if (!password) return denied("Editor is locked: add the EDIT_PASSWORD secret in Cloudflare.");
    const [scheme, encoded] = (request.headers.get("authorization") || "").split(" ");
    if (scheme !== "Basic" || !encoded) return denied("Sign in to use the editor.");
    let given = "";
    try { const decoded = atob(encoded); given = decoded.slice(decoded.indexOf(":") + 1); } catch { return denied("Sign in to use the editor."); }
    if (!safeEqual(given, password)) return denied("Wrong password.");

    // Signed in: serve the tracker page. It switches to edit mode because the path is /edit.
    const page = await env.ASSETS.fetch(new Request(new URL("/tracker/", url), request));
    return new Response(page.body, { status: page.status, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" } });
  },
};
