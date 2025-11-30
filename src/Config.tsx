import { useState, useEffect } from 'react'
import { subscribeToConfig, updateConfig, PlayerConfig, defaultConfig, login, logout, subscribeToAuth } from './firebase'
import { User } from 'firebase/auth'
import './Config.css'

function Config() {
  const [config, setConfig] = useState<PlayerConfig>(defaultConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [user, setUser] = useState<User | null>(null)
  const [authLoading, setAuthLoading] = useState(true)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [authError, setAuthError] = useState('')
  const [newImageName, setNewImageName] = useState('')

  useEffect(() => {
    const unsubscribe = subscribeToAuth((authUser) => {
      setUser(authUser)
      setAuthLoading(false)
    })
    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (user) {
      const unsubscribe = subscribeToConfig((newConfig) => {
        setConfig(newConfig)
      })
      return () => unsubscribe()
    }
  }, [user])

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setAuthError('')
    try {
      await login(email, password)
    } catch {
      setAuthError('Login fehlgeschlagen')
    }
  }

  const handleLogout = async () => {
    await logout()
  }

  const handleScaleChange = async (value: number) => {
    const newConfig = { ...config, scale: value }
    setConfig(newConfig)
    await saveConfig(newConfig)
  }

  const handleBackgroundModeChange = async (mode: 'cover' | 'black') => {
    const newConfig = { ...config, backgroundMode: mode }
    setConfig(newConfig)
    await saveConfig(newConfig)
  }

  const handleProgressBarChange = async (show: boolean) => {
    const newConfig = { ...config, showProgressBar: show }
    setConfig(newConfig)
    await saveConfig(newConfig)
  }

  const handleDisplayModeChange = async (mode: 'player' | 'images') => {
    const newConfig = { ...config, displayMode: mode }
    setConfig(newConfig)
    await saveConfig(newConfig)
  }

  const handleAddImage = async () => {
    if (!newImageName.trim()) return
    const imageName = newImageName.trim()
    if (config.availableImages.includes(imageName)) return
    const newConfig = {
      ...config,
      availableImages: [...config.availableImages, imageName]
    }
    setConfig(newConfig)
    setNewImageName('')
    await saveConfig(newConfig)
  }

  const handleRemoveImage = async (imageName: string) => {
    const newConfig = {
      ...config,
      availableImages: config.availableImages.filter(img => img !== imageName),
      enabledImages: config.enabledImages.filter(img => img !== imageName),
      frozenImage: config.frozenImage === imageName ? null : config.frozenImage
    }
    setConfig(newConfig)
    await saveConfig(newConfig)
  }

  const handleToggleImageEnabled = async (imageName: string) => {
    const isEnabled = config.enabledImages.includes(imageName)
    const newConfig = {
      ...config,
      enabledImages: isEnabled
        ? config.enabledImages.filter(img => img !== imageName)
        : [...config.enabledImages, imageName]
    }
    setConfig(newConfig)
    await saveConfig(newConfig)
  }

  const handleFreezeImage = async (imageName: string | null) => {
    const newConfig = { ...config, frozenImage: imageName }
    setConfig(newConfig)
    await saveConfig(newConfig)
  }

  const handleIntervalChange = async (interval: number) => {
    const newConfig = { ...config, imageInterval: interval }
    setConfig(newConfig)
    await saveConfig(newConfig)
  }

  const saveConfig = async (newConfig: PlayerConfig) => {
    setSaving(true)
    setSaved(false)
    try {
      await updateConfig(newConfig)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    } catch (error) {
      console.error('Failed to save config:', error)
    }
    setSaving(false)
  }

  if (authLoading) {
    return (
      <div className="config-container">
        <div className="loading">Laden...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="config-container">
        <div className="login-form-container">
          <h1 className="config-title">Anmelden</h1>
          <form onSubmit={handleLogin} className="login-form">
            <input
              type="email"
              placeholder="E-Mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input"
              required
            />
            <input
              type="password"
              placeholder="Passwort"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input"
              required
            />
            {authError && <p className="auth-error">{authError}</p>}
            <button type="submit" className="login-submit">Anmelden</button>
          </form>
        </div>
      </div>
    )
  }

  return (
    <div className="config-container">
      <div className="config-header">
        <h1 className="config-title">Player Konfiguration</h1>
        <button onClick={handleLogout} className="logout-button">Abmelden</button>
      </div>

      <div className="config-section">
        <h2>Skalierung</h2>
        <div className="scale-control">
          <input
            type="range"
            min="0.25"
            max="0.75"
            step="0.05"
            value={config.scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="scale-slider"
          />
          <span className="scale-value">{(config.scale * 100).toFixed(0)}%</span>
        </div>
        <div className="scale-presets">
          <button onClick={() => handleScaleChange(0.25)} className={config.scale === 0.25 ? 'active' : ''}>25%</button>
          <button onClick={() => handleScaleChange(0.375)} className={config.scale === 0.375 ? 'active' : ''}>37.5%</button>
          <button onClick={() => handleScaleChange(0.5)} className={config.scale === 0.5 ? 'active' : ''}>50%</button>
          <button onClick={() => handleScaleChange(0.625)} className={config.scale === 0.625 ? 'active' : ''}>62.5%</button>
          <button onClick={() => handleScaleChange(0.75)} className={config.scale === 0.75 ? 'active' : ''}>75%</button>
        </div>
      </div>

      <div className="config-section">
        <h2>Hintergrund</h2>
        <div className="background-options">
          <button
            className={`background-option ${config.backgroundMode === 'cover' ? 'active' : ''}`}
            onClick={() => handleBackgroundModeChange('cover')}
          >
            <div className="option-preview cover-preview"></div>
            <span>Cover (Blur)</span>
          </button>
          <button
            className={`background-option ${config.backgroundMode === 'black' ? 'active' : ''}`}
            onClick={() => handleBackgroundModeChange('black')}
          >
            <div className="option-preview black-preview"></div>
            <span>Schwarz</span>
          </button>
        </div>
      </div>

      <div className="config-section">
        <h2>Fortschrittsanzeige</h2>
        <div className="toggle-container">
          <label className="toggle">
            <input
              type="checkbox"
              checked={config.showProgressBar}
              onChange={(e) => handleProgressBarChange(e.target.checked)}
            />
            <span className="toggle-slider"></span>
          </label>
          <span className="toggle-label">
            {config.showProgressBar ? 'Aktiviert' : 'Deaktiviert'}
          </span>
        </div>
      </div>

      <div className="config-section">
        <h2>Anzeigemodus</h2>
        <div className="background-options">
          <button
            className={`background-option ${config.displayMode === 'player' ? 'active' : ''}`}
            onClick={() => handleDisplayModeChange('player')}
          >
            <div className="option-preview player-preview"></div>
            <span>Spotify Player</span>
          </button>
          <button
            className={`background-option ${config.displayMode === 'images' ? 'active' : ''}`}
            onClick={() => handleDisplayModeChange('images')}
          >
            <div className="option-preview images-preview"></div>
            <span>Bilder-Slideshow</span>
          </button>
        </div>
      </div>

      {config.displayMode === 'images' && (
        <>
          <div className="config-section">
            <h2>Bilder verwalten</h2>
            <div className="add-image-form">
              <input
                type="text"
                placeholder="Dateiname (z.B. bild1.jpg)"
                value={newImageName}
                onChange={(e) => setNewImageName(e.target.value)}
                className="image-input"
                onKeyDown={(e) => e.key === 'Enter' && handleAddImage()}
              />
              <button onClick={handleAddImage} className="add-image-button">Hinzufügen</button>
            </div>
            <p className="image-hint">Bilder müssen in /img/ abgelegt sein</p>
            {config.availableImages.length > 0 && (
              <div className="image-list">
                {config.availableImages.map((img) => (
                  <div key={img} className="image-item">
                    <img src={`/img/${img}`} alt={img} className="image-thumbnail" />
                    <span className="image-name">{img}</span>
                    <div className="image-actions">
                      <label className="image-checkbox">
                        <input
                          type="checkbox"
                          checked={config.enabledImages.includes(img)}
                          onChange={() => handleToggleImageEnabled(img)}
                        />
                        <span>Aktiv</span>
                      </label>
                      <button
                        className={`freeze-button ${config.frozenImage === img ? 'frozen' : ''}`}
                        onClick={() => handleFreezeImage(config.frozenImage === img ? null : img)}
                      >
                        {config.frozenImage === img ? 'Eingefroren' : 'Einfrieren'}
                      </button>
                      <button
                        className="remove-image-button"
                        onClick={() => handleRemoveImage(img)}
                      >
                        Entfernen
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="config-section">
            <h2>Wechselintervall</h2>
            <div className="interval-control">
              <input
                type="range"
                min="3"
                max="60"
                step="1"
                value={config.imageInterval}
                onChange={(e) => handleIntervalChange(parseInt(e.target.value))}
                className="scale-slider"
              />
              <span className="scale-value">{config.imageInterval}s</span>
            </div>
            <div className="scale-presets">
              <button onClick={() => handleIntervalChange(5)} className={config.imageInterval === 5 ? 'active' : ''}>5s</button>
              <button onClick={() => handleIntervalChange(10)} className={config.imageInterval === 10 ? 'active' : ''}>10s</button>
              <button onClick={() => handleIntervalChange(15)} className={config.imageInterval === 15 ? 'active' : ''}>15s</button>
              <button onClick={() => handleIntervalChange(30)} className={config.imageInterval === 30 ? 'active' : ''}>30s</button>
              <button onClick={() => handleIntervalChange(60)} className={config.imageInterval === 60 ? 'active' : ''}>60s</button>
            </div>
          </div>
        </>
      )}

      <div className="config-status">
        {saving && <span className="status-saving">Speichern...</span>}
        {saved && <span className="status-saved">Gespeichert!</span>}
      </div>

      <a href="#/" className="back-link">Zurück zum Player</a>
    </div>
  )
}

export default Config
