// Block internal generated paths from direct public access.
const BLOCKED_PATHS = ['/pages/'];

export async function onRequest(context) {
  const url = new URL(context.request.url);
  const pathname = url.pathname;

  for (const blocked of BLOCKED_PATHS) {
    if (pathname.startsWith(blocked)) {
      const response = await context.env.ASSETS.fetch(new URL('/404.html', url.origin));
      return new Response(response.body, {
        status: 404,
        headers: response.headers,
      });
    }
  }

  return context.next();
}
