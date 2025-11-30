export const onRequestGet: PagesFunction = async (context) => {
  const cookies = parseCookies(context.request.headers.get('Cookie') || '')
  const accessToken = cookies['spotify_access_token']
  const refreshToken = cookies['spotify_refresh_token']

  return new Response(JSON.stringify({
    authenticated: !!(accessToken || refreshToken)
  }), {
    headers: { 'Content-Type': 'application/json' }
  })
}

function parseCookies(cookieHeader: string): Record<string, string> {
  const cookies: Record<string, string> = {}
  if (!cookieHeader) return cookies

  cookieHeader.split(';').forEach(cookie => {
    const [name, ...rest] = cookie.split('=')
    if (name && rest.length > 0) {
      cookies[name.trim()] = rest.join('=').trim()
    }
  })

  return cookies
}
