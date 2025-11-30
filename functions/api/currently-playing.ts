interface Env {
  SPOTIFY_CLIENT_ID: string
  SPOTIFY_CLIENT_SECRET: string
}

interface SpotifyTrack {
  item: {
    name: string
    artists: Array<{ name: string }>
    album: {
      images: Array<{ url: string; width: number; height: number }>
    }
  }
  is_playing: boolean
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const cookies = parseCookies(context.request.headers.get('Cookie') || '')
  let accessToken = cookies['spotify_access_token']
  const refreshToken = cookies['spotify_refresh_token']
  const expiresAt = parseInt(cookies['spotify_expires_at'] || '0')

  // Check if token needs refresh
  if ((!accessToken || Date.now() >= expiresAt) && refreshToken) {
    const refreshResult = await refreshAccessToken(
      refreshToken,
      context.env.SPOTIFY_CLIENT_ID,
      context.env.SPOTIFY_CLIENT_SECRET
    )

    if (refreshResult.error) {
      return new Response(JSON.stringify({ error: 'Token refresh failed' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    accessToken = refreshResult.access_token

    // Update cookies with new token
    const newExpiresAt = Date.now() + (refreshResult.expires_in * 1000)
    const headers = new Headers()
    headers.append('Set-Cookie', `spotify_access_token=${accessToken}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${refreshResult.expires_in}`)
    headers.append('Set-Cookie', `spotify_expires_at=${newExpiresAt}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${refreshResult.expires_in}`)
    headers.append('Content-Type', 'application/json')

    const trackData = await fetchCurrentlyPlaying(accessToken)
    return new Response(JSON.stringify(trackData), { headers })
  }

  if (!accessToken) {
    return new Response(JSON.stringify({ error: 'Not authenticated' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' }
    })
  }

  const trackData = await fetchCurrentlyPlaying(accessToken)

  if (trackData === null) {
    return new Response(null, { status: 204 })
  }

  return new Response(JSON.stringify(trackData), {
    headers: { 'Content-Type': 'application/json' }
  })
}

async function fetchCurrentlyPlaying(accessToken: string) {
  const response = await fetch('https://api.spotify.com/v1/me/player/currently-playing', {
    headers: {
      'Authorization': `Bearer ${accessToken}`
    }
  })

  if (response.status === 204 || response.status === 202) {
    return null
  }

  if (!response.ok) {
    return { error: 'Failed to fetch currently playing' }
  }

  const data = await response.json() as SpotifyTrack

  if (!data.item) {
    return null
  }

  // Get the largest album art
  const albumArt = data.item.album.images.sort((a, b) => b.width - a.width)[0]?.url || ''

  return {
    name: data.item.name,
    artists: data.item.artists.map(a => a.name),
    albumArt: albumArt,
    isPlaying: data.is_playing
  }
}

async function refreshAccessToken(refreshToken: string, clientId: string, clientSecret: string) {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`)
    },
    body: new URLSearchParams({
      grant_type: 'refresh_token',
      refresh_token: refreshToken
    })
  })

  if (!response.ok) {
    return { error: 'Failed to refresh token' }
  }

  return response.json() as Promise<{ access_token: string; expires_in: number }>
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
