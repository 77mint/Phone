export async function onRequestGet(context) {
  const reqUrl = new URL(context.request.url);
  const fontUrl = (reqUrl.searchParams.get('url') || '').trim();
  const rawName = (reqUrl.searchParams.get('name') || 'CustomFont').trim();

  if (!/^https?:\/\//i.test(fontUrl)) {
    return new Response('/* invalid font url */', {
      status: 400,
      headers: { 'Content-Type': 'text/css; charset=utf-8' }
    });
  }

  const safeName = rawName.replace(/["'\\\r\n;{}]/g, '') || 'CustomFont';
  const safeUrl = fontUrl.replace(/["'\\\r\n]/g, '');

  const css = `@font-face {\n  font-family: "${safeName}";\n  src: url("${safeUrl}");\n  font-display: swap;\n}\n`;

  return new Response(css, {
    status: 200,
    headers: {
      'Content-Type': 'text/css; charset=utf-8',
      'Access-Control-Allow-Origin': '*',
      'Cache-Control': 'public, max-age=31536000'
    }
  });
}