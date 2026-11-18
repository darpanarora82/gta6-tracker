// The site moved to https://trackgta6.com. On Vercel, every request is forwarded there,
// keeping the path and query, with a permanent (308) redirect so search engines move too.
// (The vercel.json redirect wasn't applied on this project, so this does it instead.)

export const config = {
  matcher: "/:path*",
};

export default function middleware(request) {
  const url = new URL(request.url);
  return new Response(null, {
    status: 308,
    headers: { Location: "https://trackgta6.com" + url.pathname + url.search, "Cache-Control": "public, max-age=3600" },
  });
}
