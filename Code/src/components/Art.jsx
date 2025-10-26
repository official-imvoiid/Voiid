import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  X,
  ZoomIn,
  ZoomOut,
  Play,
  Expand,
  ChevronLeft,
  ChevronRight,
  Pause,
  Download,
  Eye,
  EyeOff
} from 'lucide-react';

// Define ImageLightbox first so it’s ready when Art calls it.
const ImageLightbox = ({ images, initialImageIndex, onClose }) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(initialImageIndex);
  const [isZoomed, setIsZoomed] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const thumbnailStripRef = useRef(null);

  const resetZoomAndPosition = useCallback(() => {
    setIsZoomed(false);
    setPosition({ x: 0, y: 0 });
    setIsDragging(false);
  }, []);

  const handlePrevious = useCallback(() => {
    setCurrentImageIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
    resetZoomAndPosition();
  }, [images.length, resetZoomAndPosition]);

  const handleNext = useCallback(() => {
    setCurrentImageIndex((prev) =>
      prev === images.length - 1 ? 0 : prev + 1
    );
    resetZoomAndPosition();
  }, [images.length, resetZoomAndPosition]);

  const toggleZoom = useCallback(() => {
    setIsZoomed((prev) => {
      if (prev) {
        setPosition({ x: 0, y: 0 });
        setIsDragging(false);
      }
      return !prev;
    });
  }, []);

  const toggleSlideshow = useCallback(() => {
    setIsPlaying((prev) => !prev);
  }, []);

  const toggleFullscreen = useCallback(async () => {
    if (!containerRef.current) return;
    try {
      if (!document.fullscreenElement) {
        await containerRef.current.requestFullscreen();
        setIsFullscreen(true);
      } else {
        await document.exitFullscreen();
        setIsFullscreen(false);
      }
    } catch (err) {
      console.error('Fullscreen error:', err);
    }
  }, []);

  const handleDownload = useCallback(() => {
    const link = document.createElement('a');
    link.href = images[currentImageIndex].url;
    link.download = `ai-artwork-${currentImageIndex + 1}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [currentImageIndex, images]);

  const handleMouseDown = useCallback(
    (e) => {
      if (!isZoomed) return;
      e.preventDefault();
      setIsDragging(true);
      setDragStart({
        x: e.clientX - position.x,
        y: e.clientY - position.y,
      });
    },
    [isZoomed, position.x, position.y]
  );

  const handleMouseMove = useCallback(
    (e) => {
      if (!isDragging || !isZoomed || !imageRef.current || !containerRef.current)
        return;
      e.preventDefault();
      const currentX = e.clientX - dragStart.x;
      const currentY = e.clientY - dragStart.y;

      const imageRect = imageRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const xOverflow = Math.max(0, imageRect.width - containerRect.width);
      const yOverflow = Math.max(0, imageRect.height - containerRect.height);
      const maxX = xOverflow / 2;
      const maxY = yOverflow / 2;
      const constrainedX = Math.max(-maxX, Math.min(maxX, currentX));
      const constrainedY = Math.max(-maxY, Math.min(maxY, currentY));
      setPosition({ x: constrainedX, y: constrainedY });
    },
    [isDragging, isZoomed, dragStart.x, dragStart.y]
  );

  const handleMouseUpOrLeave = useCallback(() => {
    if (isDragging) setIsDragging(false);
  }, [isDragging]);

  const handleWheel = useCallback(
    (e) => {
      if (!isZoomed || !imageRef.current || !containerRef.current) return;
      e.preventDefault();
      const sensitivity = 0.5;
      setPosition((prev) => {
        const newX = prev.x - e.deltaX * sensitivity;
        const newY = prev.y - e.deltaY * sensitivity;
        const imageRect = imageRef.current.getBoundingClientRect();
        const containerRect = containerRef.current.getBoundingClientRect();
        const xOverflow = Math.max(0, imageRect.width - containerRect.width);
        const yOverflow = Math.max(0, imageRect.height - containerRect.height);
        const maxX = xOverflow / 2;
        const maxY = yOverflow / 2;
        return {
          x: Math.max(-maxX, Math.min(maxX, newX)),
          y: Math.max(-maxY, Math.min(maxY, newY)),
        };
      });
    },
    [isZoomed]
  );

  useEffect(() => {
    let interval;
    if (isPlaying) {
      interval = setInterval(handleNext, 3000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, handleNext]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'ArrowLeft':
          handlePrevious();
          break;
        case 'ArrowRight':
          handleNext();
          break;
        case 'Escape':
          document.fullscreenElement
            ? document.exitFullscreen()
            : onClose();
          break;
        case 'f':
        case 'F':
          toggleFullscreen();
          break;
        case ' ':
          e.preventDefault();
          toggleSlideshow();
          break;
        case 'z':
        case 'Z':
          toggleZoom();
          break;
        case 'd':
        case 'D':
          handleDownload();
          break;
        case 't':
        case 'T':
          setShowTimeline((prev) => !prev);
          break;
        default:
          break;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    handlePrevious,
    handleNext,
    toggleFullscreen,
    toggleSlideshow,
    toggleZoom,
    handleDownload,
    onClose
  ]);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () =>
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  useEffect(() => {
    if (thumbnailStripRef.current && showTimeline) {
      const activeThumbnail = thumbnailStripRef.current.querySelector(
        `[data-index="${currentImageIndex}"]`
      );
      if (activeThumbnail) {
        activeThumbnail.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }
  }, [currentImageIndex, showTimeline]);

  return (
    <div
      ref={containerRef}
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0, 0, 0, 0.95)',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        alignItems: 'center',
        zIndex: 1000,
        overflow: 'hidden',
      }}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUpOrLeave}
      onMouseLeave={handleMouseUpOrLeave}
      onWheel={handleWheel}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '1rem',
          backgroundColor: 'rgba(0, 0, 0, 0.3)',
          zIndex: 20,
        }}
      >
        <div style={{ color: 'white', fontSize: '0.9rem' }}>
          {currentImageIndex + 1} / {images.length}
        </div>
        <div style={{ display: 'flex', gap: '0.5rem' }}>
          <button
            className="lightbox-icon-button"
            onClick={() => setShowTimeline((prev) => !prev)}
          >
            {showTimeline ? <EyeOff size={22} /> : <Eye size={22} />}
          </button>
          <button className="lightbox-icon-button" onClick={toggleZoom}>
            {isZoomed ? <ZoomOut size={22} /> : <ZoomIn size={22} />}
          </button>
          <button
            className="lightbox-icon-button"
            onClick={toggleSlideshow}
          >
            {isPlaying ? <Pause size={22} /> : <Play size={22} />}
          </button>
          <button className="lightbox-icon-button" onClick={toggleFullscreen}>
            <Expand size={22} />
          </button>
          <button className="lightbox-icon-button" onClick={handleDownload}>
            <Download size={22} />
          </button>
          <button className="lightbox-icon-button" onClick={onClose}>
            <X size={24} />
          </button>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          width: '100%',
          height: `calc(100% - ${showTimeline ? '120px' : '60px'})`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <button
          className="lightbox-nav-button"
          onClick={handlePrevious}
          style={{ left: '1rem' }}
        >
          <ChevronLeft size={32} />
        </button>
        <div
          ref={imageRef}
          style={{
            transition: isDragging ? 'none' : 'transform 0.3s ease',
            transform: `translate(${position.x}px, ${position.y}px) scale(${
              isZoomed ? 2 : 1
            })`,
            cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          onMouseDown={handleMouseDown}
        >
          <img
            src={images[currentImageIndex].url}
            alt={images[currentImageIndex].alt}
            className="lightbox-image"
            style={{
              maxWidth: '90vw',
              maxHeight: '80vh',
              objectFit: 'contain',
              userSelect: 'none',
            }}
          />
        </div>
        <button
          className="lightbox-nav-button"
          onClick={handleNext}
          style={{ right: '1rem' }}
        >
          <ChevronRight size={32} />
        </button>
      </div>
      {showTimeline && (
        <div
          ref={thumbnailStripRef}
          style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            display: 'flex',
            gap: '0.5rem',
            padding: '0.75rem 1rem',
            backgroundColor: 'rgba(0, 0, 0, 0.3)',
            overflowX: 'auto',
            zIndex: 20,
          }}
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              data-index={index}
              onClick={() => {
                setCurrentImageIndex(index);
                resetZoomAndPosition();
              }}
              style={{
                padding: 2,
                border:
                  index === currentImageIndex
                    ? '2px solid #3b82f6'
                    : '2px solid transparent',
                borderRadius: '4px',
                background: 'none',
                cursor: 'pointer',
                opacity: index === currentImageIndex ? 1 : 0.7,
                transition: 'opacity 0.2s ease, border-color 0.2s ease',
              }}
            >
              <img
                src={image.thumbnail}
                alt={`Thumbnail ${index + 1}`}
                style={{
                  width: '70px',
                  height: '50px',
                  objectFit: 'cover',
                  borderRadius: '2px',
                }}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const Art = () => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);

  // Create an array of 47 images.
  const images = Array.from({ length: 47 }, (_, i) => ({
    id: i + 1,
    url: `/images/${i + 1}.png`,
    thumbnail: `/images/${i + 1}.png`,
    alt: `AI Artwork ${i + 1}`,
  }));

  const openLightbox = (index) => {
    setSelectedIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
  };

  return (
    <div
      style={{
        backgroundColor: 'black',
        height: '100vh',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <style>{`
        .back-home-link {
          position: relative;
          display: inline-block;
          padding: 0.4rem 1rem;
          color: #000 !important;
          font-weight: 500;
          text-decoration: none;
          overflow: hidden;
          border-radius: 9999px;
          background: rgba(255, 255, 255, 0.96);
          backdrop-filter: blur(2px);
          -webkit-backdrop-filter: blur(6px);
          font-size: 0.85rem;
          cursor: pointer;
          transition: color 0.4s ease;
        }
        .back-home-link-bg {
          position: absolute;
          top: 0;
          left: 0;
          width: 35%;
          height: 100%;
          background: rgba(0, 255, 170, 0.93);
          border-radius: 9999px;
          transition: width 0.4s ease;
          z-index: 0;
        }
        .back-home-link:hover .back-home-link-bg {
          width: 100%;
        }
        .back-home-link-text {
          position: relative;
          z-index: 1;
          white-space: nowrap;
        }
        .gallery-image {
          width: 100%;
          height: 100%;
          display: block;
          transition: transform 0.2s ease-in-out;
          border-radius: 8px;
          object-fit: contain;
        }
        .gallery-image-container {
          position: relative;
          width: 100%;
          aspect-ratio: auto;
          overflow: hidden;
          border-radius: 8px;
          background-color: #1a1a1a;
          margin-bottom: 16px;
        }
        .gallery-image-wrapper {
          position: relative;
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .gallery-container {
          column-gap: 16px;
          padding: 16px;
          max-width: 1400px;
          width: 100%;
          margin: 0 auto;
          box-sizing: border-box;
        }
        @media (min-width: 1401px) {
          .gallery-container { column-count: 4; }
        }
        @media (min-width: 1001px) and (max-width: 1400px) {
          .gallery-container { column-count: 3; }
        }
        @media (min-width: 601px) and (max-width: 1000px) {
          .gallery-container { column-count: 2; }
        }
        @media (max-width: 600px) {
          .gallery-container { column-count: 1; }
        }
        .lightbox-image {
          max-width: 100%;
          max-height: 90vh;
          object-fit: contain;
        }
        .lightbox-icon-button {
          background: none;
          border: none;
          padding: 0.5rem;
          color: white;
          cursor: pointer;
          line-height: 0;
          transition: opacity 0.2s ease;
        }
        .lightbox-icon-button:hover {
          opacity: 0.8;
        }
        .lightbox-nav-button {
          position: absolute;
          top: 50%;
          transform: translateY(-50%);
          background-color: rgba(0, 0, 0, 0.5);
          border-radius: 50%;
          padding: 0.5rem;
          border: none;
          color: white;
          cursor: pointer;
          z-index: 10;
          transition: background-color 0.2s ease;
        }
        .lightbox-nav-button:hover {
          background-color: rgba(0, 0, 0, 0.7);
        }
      `}</style>

      <div
        style={{
          width: '100%',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          padding: '20px 40px',
          fontFamily: 'Arial, sans-serif',
          flexShrink: 0,
        }}
      >
        <h1
          style={{
            color: '#f39c12',
            margin: 0,
            fontSize: '38px',
            fontWeight: 'bold',
          }}
        >
          AI Canvas 🖌️🎨
        </h1>
        <Link to="/" className="back-home-link">
          <span className="back-home-link-bg" />
          <span className="back-home-link-text">&lt;&lt; Back home</span>
        </Link>
      </div>

      <div className="gallery-container">
        {images.map((image, index) => (
          <div
            key={image.id}
            style={{
              cursor: 'pointer',
              breakInside: 'avoid',
              position: 'relative',
              boxShadow: '0 4px 8px rgba(243, 156, 18, 0.1)',
            }}
            onClick={() => openLightbox(index)}
            role="button"
            tabIndex={0}
            onKeyDown={(e) =>
              e.key === 'Enter' && openLightbox(index)
            }
          >
            <div className="gallery-image-container">
              <div className="gallery-image-wrapper">
                <img
                  className="gallery-image"
                  src={image.thumbnail}
                  alt={image.alt}
                  loading="lazy"
                  onMouseOver={(e) =>
                    (e.currentTarget.style.transform = 'scale(1.03)')
                  }
                  onMouseOut={(e) =>
                    (e.currentTarget.style.transform = 'scale(1)')
                  }
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ flexShrink: 0, padding: '15px 0 20px 0' }}>
        <p
          style={{
            textAlign: 'center',
            color: '#888',
            fontSize: '16px',
            maxWidth: '800px',
            margin: '0 auto',
            padding: '0 15px',
          }}
        >
          Note to all my artist friends: Since the rise of AI, people have
          started comparing AI creations to traditional art... Respect to all
          artists out there. Thank you!!
        </p>
      </div>

      {lightboxOpen && (
        <ImageLightbox
          images={images}
          initialImageIndex={selectedIndex}
          onClose={closeLightbox}
        />
      )}
    </div>
  );
};

export default Art;
