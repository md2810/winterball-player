import { useState, useEffect } from 'react'
import { subscribeToConfig, PlayerConfig, defaultConfig } from './firebase'
import ImageSlideshow from './ImageSlideshow'

function Home() {
  const [config, setConfig] = useState<PlayerConfig>(defaultConfig)

  useEffect(() => {
    const unsubscribe = subscribeToConfig((newConfig) => {
      setConfig(newConfig)
    })
    return () => unsubscribe()
  }, [])

  return <ImageSlideshow config={config} />
}

export default Home
