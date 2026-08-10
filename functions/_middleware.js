export async function onRequest(context) {
  const url = new URL(context.request.url);

  // If the request is using the default *.pages.dev domain, redirect 301 to pacedigitalworks.com
  if (url.hostname.endsWith('.pages.dev')) {
    url.hostname = 'pacedigitalworks.com';
    return Response.redirect(url.toString(), 301);
  }

  return context.next();
}
