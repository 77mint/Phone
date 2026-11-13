export async function onRequestGet(context) {
  const url = new URL(context.request.url);
  const code = url.searchParams.get('code');
  const clientId = context.env.GITHUB_CLIENT_ID;
  const clientSecret = context.env.GITHUB_CLIENT_SECRET;

  if (!code || !clientId || !clientSecret) {
    return Response.redirect(url.origin + '/#gh_error=missing_params', 302);
  }

  try {
    const res = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: url.origin + '/api/github/callback'
      })
    });

    const data = await res.json();
    if (!data || !data.access_token) {
      const msg = (data && (data.error_description || data.error)) || 'auth_failed';
      return Response.redirect(url.origin + '/#gh_error=' + encodeURIComponent(msg), 302);
    }

    return Response.redirect(url.origin + '/#gh_token=' + encodeURIComponent(data.access_token), 302);
  } catch (err) {
    return Response.redirect(url.origin + '/#gh_error=server_error', 302);
  }
}