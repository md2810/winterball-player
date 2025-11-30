import { useState, useEffect } from 'react'
import { PlayerConfig } from './firebase'
import './ImageSlideshow.css'

interface ImageSlideshowProps {
  config: PlayerConfig
}

function ImageSlideshow({ config }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentImage, setCurrentImage] = useState<string | null>(null)
  const [nextImage, setNextImage] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Determine which images to show
  const imagesToShow = config.frozenImage
    ? [config.frozenImage]
    : config.enabledImages.length > 0
      ? config.enabledImages
      : config.availableImages

  useEffect(() => {
    if (imagesToShow.length === 0) return

    // Set initial image
    setCurrentImage(imagesToShow[0])
    setCurrentIndex(0)
  }, [imagesToShow.length])

  useEffect(() => {
    // If frozen or only one image, don't cycle
    if (config.frozenImage || imagesToShow.length <= 1) return

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % imagesToShow.length
      setNextImage(imagesToShow[nextIndex])
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentImage(imagesToShow[nextIndex])
        setCurrentIndex(nextIndex)
        setIsTransitioning(false)
        setNextImage(null)
      }, 1000)
    }, config.imageInterval * 1000)

    return () => clearInterval(interval)
  }, [config.frozenImage, config.imageInterval, currentIndex, imagesToShow])

  if (imagesToShow.length === 0) {
    return (
      <div className="slideshow-container">
        <p className="no-images">Keine Bilder verfügbar</p>
      </div>
    )
  }

  return (
    <div className="slideshow-container">
      {currentImage && (
        <img
          src={`/img/${currentImage}`}
          alt="Slideshow"
          className={`slideshow-image ${isTransitioning ? 'fading-out' : ''}`}
        />
      )}
      {nextImage && isTransitioning && (
        <img
          src={`/img/${nextImage}`}
          alt="Slideshow"
          className="slideshow-image fading-in"
        />
      )}
    </div>
  )
}

export default ImageSlideshow
