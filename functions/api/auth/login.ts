interface Env {
  SPOTIFY_CLIENT_ID: string
  SPOTIFY_CLIENT_SECRET: string
  SPOTIFY_REDIRECT_URI: string
}

export const onRequestGet: PagesFunction<Env> = async (context) => {
  const clientId = context.env.SPOTIFY_CLIENT_ID
  const redirectUri = context.env.SPOTIFY_REDIRECT_URI || `${new URL(context.request.url).origin}/api/auth/callback`

  const scope = 'user-read-currently-playing user-read-playback-state'

  const params = new URLSearchParams({
    response_type: 'code',
    client_id: clientId,
    scope: scope,
    redirect_uri: redirectUri,
    show_dialog: 'false'
  })

  return Response.redirect(`https://accounts.spotify.com/authorize?${params.toString()}`, 302)
}
