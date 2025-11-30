import { useState, useEffect } from 'react'
import { subscribeToConfig, PlayerConfig, defaultConfig } from './firebase'
import Player from './Player'
import ImageSlideshow from './ImageSlideshow'

function Home() {
  const [config, setConfig] = useState<PlayerConfig>(defaultConfig)

  useEffect(() => {
    const unsubscribe = subscribeToConfig((newConfig) => {
      setConfig(newConfig)
    })
    return () => unsubscribe()
  }, [])

  if (config.displayMode === 'images') {
    return <ImageSlideshow config={config} />
  }

  return <Player />
}

export default Home
