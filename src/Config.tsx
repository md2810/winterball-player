import { useState, useEffect } from 'react'
import { subscribeToConfig, updateConfig, PlayerConfig, defaultConfig } from './firebase'
import './Config.css'

function Config() {
  const [config, setConfig] = useState<PlayerConfig>(defaultConfig)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    const unsubscribe = subscribeToConfig((newConfig) => {
      setConfig(newConfig)
    })
    return () => unsubscribe()
  }, [])

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

  return (
    <div className="config-container">
      <h1 className="config-title">Player Konfiguration</h1>

      <div className="config-section">
        <h2>Skalierung</h2>
        <div className="scale-control">
          <input
            type="range"
            min="0.5"
            max="2"
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

      <div className="config-status">
        {saving && <span className="status-saving">Speichern...</span>}
        {saved && <span className="status-saved">Gespeichert!</span>}
      </div>

      <a href="/" className="back-link">Zurck zum Player</a>
    </div>
  )
}

export default Config
