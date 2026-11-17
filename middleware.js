// Password-protects the editor at /edit. Runs on Vercel before the page is served.
// Set EDIT_PASSWORD in Vercel → Project → Settings → Environment Variables, then redeploy.
// The browser shows a login box: any username, the password must match EDIT_PASSWORD.

export const config = {
  matcher: ["/edit", "/edit/"],
};

function safeEqual(a, b) {
  if (typeof a !== "string" || typeof b !== "string" || a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

function denied(message) {
  return new Response(message, {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Tracker editor", charset="UTF-8"',
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}

export default async function middleware(request) {
  const password = process.env.EDIT_PASSWORD;
  if (!password) return denied("Editor is locked: EDIT_PASSWORD is not set in Vercel.");

  const header = request.headers.get("authorization") || "";
  const [scheme, encoded] = header.split(" ");
  if (scheme !== "Basic" || !encoded) return denied("Sign in to use the editor.");

  let given = "";
  try {
    const decoded = atob(encoded);
    given = decoded.slice(decoded.indexOf(":") + 1);
  } catch {
    return denied("Sign in to use the editor.");
  }
  if (!safeEqual(given, password)) return denied("Wrong password.");

  // Signed in: serve the normal page. It switches to edit mode because the path is /edit.
  const page = await fetch(new URL("/tracker/index.html", request.url));
  return new Response(page.body, {
    status: page.status,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "no-store",
      "X-Robots-Tag": "noindex",
    },
  });
}
