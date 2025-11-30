import { useState, useEffect } from 'react'
import { PlayerConfig, PLAYER_SLIDE } from './firebase'
import Player from './Player'
import './ImageSlideshow.css'

interface ImageSlideshowProps {
  config: PlayerConfig
}

function ImageSlideshow({ config }: ImageSlideshowProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [currentSlide, setCurrentSlide] = useState<string | null>(null)
  const [nextSlide, setNextSlide] = useState<string | null>(null)
  const [isTransitioning, setIsTransitioning] = useState(false)

  // Determine which slides to show
  const slidesToShow = config.frozenImage
    ? [config.frozenImage]
    : config.enabledImages.length > 0
      ? config.enabledImages
      : config.availableImages

  useEffect(() => {
    if (slidesToShow.length === 0) return

    // Set initial slide
    setCurrentSlide(slidesToShow[0])
    setCurrentIndex(0)
  }, [slidesToShow.length])

  useEffect(() => {
    // If frozen or only one slide, don't cycle
    if (config.frozenImage || slidesToShow.length <= 1) return

    const interval = setInterval(() => {
      const nextIndex = (currentIndex + 1) % slidesToShow.length
      setNextSlide(slidesToShow[nextIndex])
      setIsTransitioning(true)

      setTimeout(() => {
        setCurrentSlide(slidesToShow[nextIndex])
        setCurrentIndex(nextIndex)
        setIsTransitioning(false)
        setNextSlide(null)
      }, 1000)
    }, config.imageInterval * 1000)

    return () => clearInterval(interval)
  }, [config.frozenImage, config.imageInterval, currentIndex, slidesToShow])

  const renderSlide = (slide: string, className: string) => {
    if (slide === PLAYER_SLIDE) {
      return (
        <div className={className}>
          <Player />
        </div>
      )
    }
    return (
      <img
        src={`/img/${slide}`}
        alt="Slideshow"
        className={className}
      />
    )
  }

  if (slidesToShow.length === 0) {
    return (
      <div className="slideshow-container">
        <p className="no-images">Keine Bilder verfügbar</p>
      </div>
    )
  }

  return (
    <div className="slideshow-container">
      {currentSlide && renderSlide(currentSlide, `slideshow-image ${isTransitioning ? 'fading-out' : ''}`)}
      {nextSlide && isTransitioning && renderSlide(nextSlide, 'slideshow-image fading-in')}
    </div>
  )
}

export default ImageSlideshow
