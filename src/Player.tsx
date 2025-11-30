import { useState, useEffect, useRef } from 'react'
import { subscribeToConfig, PlayerConfig, defaultConfig } from './firebase'
import './Player.css'

interface SpotifyTrack {
  name: string
  artists: string[]
  albumArt: string
  isPlaying: boolean
  progressMs: number
  durationMs: number
}

function Player() {
  const [currentTrack, setCurrentTrack] = useState<SpotifyTrack | null>(null)
  const [nextTrack, setNextTrack] = useState<SpotifyTrack | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [config, setConfig] = useState<PlayerConfig>(defaultConfig)
  const [progress, setProgress] = useState(0)
  const lastFetchTime = useRef<number>(Date.now())
  const lastProgressMs = useRef<number>(0)

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

  // Smooth progress interpolation
  useEffect(() => {
    if (!currentTrack || !currentTrack.isPlaying) return

    const updateProgress = () => {
      const elapsed = Date.now() - lastFetchTime.current
      const estimatedProgress = lastProgressMs.current + elapsed
      const percentage = Math.min((estimatedProgress / currentTrack.durationMs) * 100, 100)
      setProgress(percentage)
    }

    updateProgress()
    const interval = setInterval(updateProgress, 50)
    return () => clearInterval(interval)
  }, [currentTrack])

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
        if (currentTrack) {
          triggerTransition(null)
        }
        return
      }
      const data = await response.json() as SpotifyTrack
      if (data.error) {
        setError(data.error as string)
        return
      }

      // Update progress tracking
      lastFetchTime.current = Date.now()
      lastProgressMs.current = data.progressMs

      // Check if track changed
      if (currentTrack && (currentTrack.name !== data.name || currentTrack.albumArt !== data.albumArt)) {
        triggerTransition(data)
      } else if (!currentTrack) {
        setCurrentTrack(data)
        setProgress((data.progressMs / data.durationMs) * 100)
      } else {
        // Same track, just update progress
        setCurrentTrack(data)
      }
      setError(null)
    } catch (err) {
      setError('Fehler beim Laden des Songs')
      console.error(err)
    }
  }

  const triggerTransition = (newTrack: SpotifyTrack | null) => {
    if (isTransitioning) return

    setNextTrack(newTrack)
    setIsTransitioning(true)

    setTimeout(() => {
      setCurrentTrack(newTrack)
      setNextTrack(null)
      setIsTransitioning(false)
      if (newTrack) {
        setProgress((newTrack.progressMs / newTrack.durationMs) * 100)
        lastProgressMs.current = newTrack.progressMs
        lastFetchTime.current = Date.now()
      }
    }, 800)
  }

  const handleLogin = () => {
    window.location.href = '/api/auth/login'
  }

  // Calculate scaled sizes based on config
  const scale = config.scale
  const coverSize = Math.round(500 * scale)
  const titleSize = 7 * scale
  const artistSize = 3.5 * scale
  const gap = Math.round(100 * scale)

  const backgroundClass = config.backgroundMode === 'black' ? 'background-black' : ''

  if (!isAuthenticated) {
    return (
      <div className={`player-container ${backgroundClass}`}>
        <button className="login-button" onClick={handleLogin}>
          Mit Spotify verbinden
        </button>
      </div>
    )
  }

  if (error) {
    return (
      <div className={`player-container ${backgroundClass}`}>
        <p className="error">{error}</p>
      </div>
    )
  }

  if (!currentTrack && !nextTrack) {
    return (
      <div className={`player-container ${backgroundClass}`}>
        <p className="no-track">Kein Song wird gerade abgespielt</p>
      </div>
    )
  }

  return (
    <div className={`player-container ${backgroundClass}`}>
      {/* Background layers */}
      {config.backgroundMode === 'cover' && (
        <>
          {currentTrack && (
            <div
              className={`background-blur ${isTransitioning ? 'fading-out' : ''}`}
              style={{ backgroundImage: `url(${currentTrack.albumArt})` }}
            />
          )}
          {nextTrack && isTransitioning && (
            <div
              className="background-blur fading-in"
              style={{ backgroundImage: `url(${nextTrack.albumArt})` }}
            />
          )}
        </>
      )}

      {/* Progress bar */}
      {config.showProgressBar && currentTrack && (
        <div className="progress-bar-container">
          <div
            className="progress-bar"
            style={{ width: `${progress}%` }}
          />
        </div>
      )}

      {/* Content */}
      <div className="content-wrapper" style={{ gap: `${gap}px` }}>
        {/* Album art */}
        <div className="album-art-wrapper" style={{ width: coverSize, height: coverSize }}>
          {currentTrack && (
            <img
              src={currentTrack.albumArt}
              alt="Album Cover"
              className={`album-art ${isTransitioning ? 'fading-out' : ''}`}
              style={{ width: coverSize, height: coverSize }}
            />
          )}
          {nextTrack && isTransitioning && (
            <img
              src={nextTrack.albumArt}
              alt="Album Cover"
              className="album-art fading-in"
              style={{ width: coverSize, height: coverSize }}
            />
          )}
        </div>

        {/* Track info */}
        <div className="track-info">
          <div className="track-name-wrapper">
            {currentTrack && (
              <h1
                className={`track-name ${isTransitioning ? 'fading-out' : ''}`}
                style={{ fontSize: `${titleSize}rem` }}
              >
                {currentTrack.name}
              </h1>
            )}
            {nextTrack && isTransitioning && (
              <h1
                className="track-name fading-in"
                style={{ fontSize: `${titleSize}rem` }}
              >
                {nextTrack.name}
              </h1>
            )}
          </div>
          <div className="track-artists-wrapper">
            {currentTrack && (
              <p
                className={`track-artists ${isTransitioning ? 'fading-out' : ''}`}
                style={{ fontSize: `${artistSize}rem` }}
              >
                {currentTrack.artists.join(', ')}
              </p>
            )}
            {nextTrack && isTransitioning && (
              <p
                className="track-artists fading-in"
                style={{ fontSize: `${artistSize}rem` }}
              >
                {nextTrack.artists.join(', ')}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Player
