import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
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
        setCurrentTrack(null)
        return
      }
      const data = await response.json()
      if ('error' in data) {
        setError(data.error as string)
        return
      }
      const track = data as SpotifyTrack

      // Update progress tracking
      lastFetchTime.current = Date.now()
      lastProgressMs.current = track.progressMs

      // Update track (framer-motion handles the transition)
      setCurrentTrack(track)
      if (!currentTrack || currentTrack.name !== track.name) {
        setProgress((track.progressMs / track.durationMs) * 100)
      }
      setError(null)
    } catch (err) {
      setError('Fehler beim Laden des Songs')
      console.error(err)
    }
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

  if (!currentTrack) {
    return (
      <div className={`player-container ${backgroundClass}`}>
        <p className="no-track">Kein Song wird gerade abgespielt</p>
      </div>
    )
  }

  // Unique key for track changes to trigger animations
  const trackKey = `${currentTrack.name}-${currentTrack.albumArt}`

  return (
    <div className={`player-container ${backgroundClass}`}>
      {/* Background layers */}
      {config.backgroundMode === 'cover' && (
        <AnimatePresence mode="wait">
          <motion.div
            key={trackKey + '-bg'}
            className="background-blur"
            style={{ backgroundImage: `url(${currentTrack.albumArt})` }}
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8, ease: 'easeInOut' }}
          />
        </AnimatePresence>
      )}

      {/* Progress bar */}
      {config.showProgressBar && (
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
          <AnimatePresence mode="wait">
            <motion.img
              key={trackKey + '-art'}
              src={currentTrack.albumArt}
              alt="Album Cover"
              className="album-art"
              style={{ width: coverSize, height: coverSize }}
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(10px)' }}
              transition={{ duration: 0.6, ease: 'easeOut' }}
            />
          </AnimatePresence>
        </div>

        {/* Track info */}
        <div className="track-info">
          <AnimatePresence mode="wait">
            <motion.div
              key={trackKey + '-info'}
              initial={{ opacity: 0, y: 20, filter: 'blur(8px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              exit={{ opacity: 0, y: -20, filter: 'blur(8px)' }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            >
              <h1
                className="track-name"
                style={{ fontSize: `${titleSize}rem` }}
              >
                {currentTrack.name}
              </h1>
              <p
                className="track-artists"
                style={{ fontSize: `${artistSize}rem` }}
              >
                {currentTrack.artists.join(', ')}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  )
}

export default Player
