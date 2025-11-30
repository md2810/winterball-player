import { useState, useEffect } from 'react'
import './App.css'

interface SpotifyTrack {
  name: string
  artists: string[]
  albumArt: string
  isPlaying: boolean
}

function App() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)

  useEffect(() => {
    // Check if we have a token
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentTrack()
      const interval = setInterval(fetchCurrentTrack, 5000)
      return () => clearInterval(interval)
    }
  }, [isAuthenticated])

  const checkAuth = async () => {
    try {
      const response = await fetch('/api/auth/status')
      const data = await response.json()
      setIsAuthenticated(data.authenticated)
    } catch {
      setIsAuthenticated(false)
    }
  }

  const fetchCurrentTrack = async () => {
    try {
      const response = await fetch('/api/currently-playing')
      if (response.status === 401) {
        setIsAuthenticated(false)
        return
      }
      if (response.status === 204) {
        setTrack(null)
        return
      }
      const data = await response.json()
      if (data.error) {
        setError(data.error)
        return
      }
      setTrack(data)
      setError(null)
    } catch (err) {
      setError('Fehler beim Laden des Songs')
      console.error(err)
    }
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  if (!isAuthenticated) {
    return (
      <div className="player-container">
        <button className="login-button" onClick={handleLogin}>
          Mit Spotify verbinden
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className="player-container">
        <p className="error">{error}</p>
      </div>
    )
  }

  if (!track) {
    return (
      <div className="player-container">
        <p className="no-track">Kein Song wird gerade abgespielt</p>
      </div>
    )
  }

  return (
    <div className="player-container">
      <div
        className="background-blur"
        style={{ backgroundImage: `url(${track.albumArt})` }}
      />
      <div className="album-art-container">
        <img src={track.albumArt} alt="Album Cover" className="album-art" />
      </div>
      <div className="track-info">
        <h1 className="track-name">{track.name}</h1>
        <p className="track-artists">{track.artists.join(', ')}</p>
      </div>
    </div>
  )
}

export default App
