import { useState, useEffect, useRef } from 'react'
import { subscribeToConfig, PlayerConfig, defaultConfig } from './firebase'
import './Player.css'

interface SpotifyTrack {
  name: string
  artists: string[]
  albumArt: string
  isPlaying: boolean
}

function Player() {
  const [track, setTrack] = useState<SpotifyTrack | null>(null)
  const [prevTrack, setPrevTrack] = useState<SpotifyTrack | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [config, setConfig] = useState<PlayerConfig>(defaultConfig)
  const transitionTimeoutRef = useRef<number | null>(null)

  useEffect(() => {
    const unsubscribe = subscribeToConfig((newConfig) => {
      setConfig(newConfig)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    checkAuth()
  }, [])

  useEffect(() => {
    if (isAuthenticated) {
      fetchCurrentTrack()
      const interval = setInterval(fetchCurrentTrack, 1000)
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
        if (track) {
          triggerTransition(null)
        } else {
          setTrack(null)
        }
        return
      }
      const data = await response.json()
      if (data.error) {
        setError(data.error)
        return
      }

      // Check if track changed
      if (track && (track.name !== data.name || track.albumArt !== data.albumArt)) {
        triggerTransition(data)
      } else if (!track) {
        setTrack(data)
      }
      setError(null)
    } catch (err) {
      setError('Fehler beim Laden des Songs')
      console.error(err)
    }
  }

  const triggerTransition = (newTrack: SpotifyTrack | null) => {
    if (transitionTimeoutRef.current) {
      clearTimeout(transitionTimeoutRef.current)
    }

    setPrevTrack(track)
    setIsTransitioning(true)

    transitionTimeoutRef.current = window.setTimeout(() => {
      setTrack(newTrack)
      setIsTransitioning(false)
      setPrevTrack(null)
    }, 500)
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  const containerStyle = {
    transform: `scale(${config.scale})`,
    transformOrigin: 'center center'
  }

  const backgroundClass = config.backgroundMode === 'black' ? 'background-black' : ''

  if (!isAuthenticated) {
    return (
      <div className={`player-container ${backgroundClass}`} style={containerStyle}>
        <button className="login-button" onClick={handleLogin}>
          Mit Spotify verbinden
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`player-container ${backgroundClass}`} style={containerStyle}>
        <p className="error">{error}</p>
      </div>
    )
  }

  if (!track && !prevTrack) {
    return (
      <div className={`player-container ${backgroundClass}`} style={containerStyle}>
        <p className="no-track">Kein Song wird gerade abgespielt</p>
      </div>
    )
  }

  const displayTrack = isTransitioning ? prevTrack : track

  return (
    <div className={`player-container ${backgroundClass}`} style={containerStyle}>
      {config.backgroundMode === 'cover' && displayTrack && (
        <>
          <div
            className={`background-blur ${isTransitioning ? 'fade-out' : 'fade-in'}`}
            style={{ backgroundImage: `url(${displayTrack.albumArt})` }}
          />
          {isTransitioning && track && (
            <div
              className="background-blur fade-in"
              style={{ backgroundImage: `url(${track.albumArt})` }}
            />
          )}
        </>
      )}

      <div className={`content-wrapper ${isTransitioning ? 'transitioning' : ''}`}>
        <div className="album-art-container">
          <img
            src={displayTrack?.albumArt}
            alt="Album Cover"
            className={`album-art ${isTransitioning ? 'fade-out' : 'fade-in'}`}
          />
          {isTransitioning && track && (
            <img
              src={track.albumArt}
              alt="Album Cover"
              className="album-art album-art-new fade-in"
            />
          )}
        </div>
        <div className="track-info">
          <h1 className={`track-name ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
            {displayTrack?.name}
          </h1>
          {isTransitioning && track && (
            <h1 className="track-name track-name-new fade-in">{track.name}</h1>
          )}
          <p className={`track-artists ${isTransitioning ? 'fade-out' : 'fade-in'}`}>
            {displayTrack?.artists.join(', ')}
          </p>
          {isTransitioning && track && (
            <p className="track-artists track-artists-new fade-in">
              {track.artists.join(', ')}
            </p>
          )}
        </div>
      </div>
    </div>
  )
}

export default Player
