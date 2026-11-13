export async function onRequestGet(context) {
  const clientId = context.env.GITHUB_CLIENT_ID;
  if (!clientId) {
    return new Response('Missing GITHUB_CLIENT_ID', { status: 500 });
  }
  const url = new URL(context.request.url);
  const redirectUri = url.origin + '/api/github/callback';
  const authUrl =
    'https://github.com/login/oauth/authorize' +
    '?client_id=' + encodeURIComponent(clientId) +
    '&redirect_uri=' + encodeURIComponent(redirectUri) +
    '&scope=' + encodeURIComponent('public_repo');

  return Response.redirect(authUrl, 302);
}