interface Env {
  SPOTIFY_CLIENT_ID: string
  SPOTIFY_CLIENT_SECRET: string
  SPOTIFY_REDIRECT_URI: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const url = new URL(context.request.url)
  const code = url.searchParams.get('code')
  const error = url.searchParams.get('error')

  if (error) {
    return new Response(`Auth error: ${error}`, { status: 400 })
  }

  if (!code) {
    return new Response('No code provided', { status: 400 })
  }

  const clientId = context.env.SPOTIFY_CLIENT_ID
  const clientSecret = context.env.SPOTIFY_CLIENT_SECRET
  const redirectUri = context.env.SPOTIFY_REDIRECT_URI || `${url.origin}/api/auth/callback`

  const tokenResponse = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirectUri
    })
  })

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text()
    return new Response(`Token error: ${errorText}`, { status: 400 })
  }

  const tokens = await tokenResponse.json() as {
    access_token: string
    refresh_token: string
    expires_in: number
  }

  // Calculate expiry time
  const expiresAt = Date.now() + (tokens.expires_in * 1000)

  // Store tokens in cookies (secure, httpOnly)
  const headers = new Headers()
  headers.append('Set-Cookie', `spotify_access_token=${tokens.access_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${tokens.expires_in}`)
  headers.append('Set-Cookie', `spotify_refresh_token=${tokens.refresh_token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=31536000`)
  headers.append('Set-Cookie', `spotify_expires_at=${expiresAt}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${tokens.expires_in}`)
  headers.append('Location', '/')

  return new Response(null, {
    status: 302,
    headers
  })
}
