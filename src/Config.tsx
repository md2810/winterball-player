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
            min="0.5"
            max="1.5"
            step="0.1"
            value={config.scale}
            onChange={(e) => handleScaleChange(parseFloat(e.target.value))}
            className="scale-slider"
          />
          <span className="scale-value">{(config.scale * 100).toFixed(0)}%</span>
        </div>
        <div className="scale-presets">
          <button onClick={() => handleScaleChange(0.5)} className={config.scale === 0.5 ? 'active' : ''}>50%</button>
          <button onClick={() => handleScaleChange(0.75)} className={config.scale === 0.75 ? 'active' : ''}>75%</button>
          <button onClick={() => handleScaleChange(1)} className={config.scale === 1 ? 'active' : ''}>100%</button>
          <button onClick={() => handleScaleChange(1.25)} className={config.scale === 1.25 ? 'active' : ''}>125%</button>
          <button onClick={() => handleScaleChange(1.5)} className={config.scale === 1.5 ? 'active' : ''}>150%</button>
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

      <div className="config-status">
        {saving && <span className="status-saving">Speichern...</span>}
        {saved && <span className="status-saved">Gespeichert!</span>}
      </div>

      <a href="/" className="back-link">Zurück zum Player</a>
    </div>
  )
}

export default Config
