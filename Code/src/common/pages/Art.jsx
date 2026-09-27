import { useState, useRef, useEffect, useCallback } from 'react';
import BackHome from "../components/BackHome";
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
  const [isPlaying, setIsPlaying] = useState(false);
  const [, setIsFullscreen] = useState(false);
  const [showTimeline, setShowTimeline] = useState(true);
  // zoom + pan: scale 1 = fit to screen; x/y = offset of the image centre
  const [view, setView] = useState({ scale: 1, x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const isZoomed = view.scale > 1;

  const containerRef = useRef(null);
  const imageRef = useRef(null);
  const thumbnailStripRef = useRef(null);
  const viewRef = useRef(view);          // latest view, for the native wheel listener
  viewRef.current = view;
  const dragRef = useRef(null);          // { x, y } where the drag grabbed the image

  const MIN_SCALE = 1;
  const MAX_SCALE = 6;

  // keep the image covering the screen - it can't be dragged off into black
  const clampView = useCallback((scale, x, y) => {
    const img = imageRef.current;
    const box = containerRef.current?.getBoundingClientRect();
    if (!img || !box || scale <= 1) return { scale: Math.max(MIN_SCALE, scale), x: 0, y: 0 };
    const maxX = Math.max(0, (img.offsetWidth * scale - box.width) / 2);
    const maxY = Math.max(0, (img.offsetHeight * scale - box.height) / 2);
    return {
      scale,
      x: Math.max(-maxX, Math.min(maxX, x)),
      y: Math.max(-maxY, Math.min(maxY, y)),
    };
  }, []);

  /* zoom to `next`, keeping the point under (clientX, clientY) still -
     without a point, zoom about the centre */
  const zoomTo = useCallback((next, clientX, clientY) => {
    const { scale, x, y } = viewRef.current;
    const target = Math.max(MIN_SCALE, Math.min(MAX_SCALE, next));
    const img = imageRef.current;
    if (!img || clientX === undefined) {
      setView(clampView(target, x * (target / scale), y * (target / scale)));
      return;
    }
    const r = img.getBoundingClientRect();
    const cx = r.left + r.width / 2 - x;       // untransformed centre
    const cy = r.top + r.height / 2 - y;
    const dx = clientX - cx;
    const dy = clientY - cy;
    const k = target / scale;
    setView(clampView(target, dx - (dx - x) * k, dy - (dy - y) * k));
  }, [clampView]);

  const resetZoomAndPosition = useCallback(() => {
    setView({ scale: 1, x: 0, y: 0 });
    setIsDragging(false);
    dragRef.current = null;
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

  // button / Z key: jump between fit and 2x
  const toggleZoom = useCallback(() => {
    if (viewRef.current.scale > 1) resetZoomAndPosition();
    else zoomTo(2);
  }, [resetZoomAndPosition, zoomTo]);

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

  // drag to pan, while zoomed in. Pointer events + pointer capture: the
  // drag keeps following the mouse (or finger) even when it leaves the image
  // or the window, instead of dropping out mid-move.
  const handlePointerDown = useCallback((e) => {
    if (viewRef.current.scale <= 1 || e.button !== 0) return;
    e.preventDefault();
    try { e.currentTarget.setPointerCapture(e.pointerId); } catch { /* pointer already gone */ }
    dragRef.current = { x: e.clientX - viewRef.current.x, y: e.clientY - viewRef.current.y };
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback((e) => {
    if (!dragRef.current) return;
    const { scale } = viewRef.current;
    setView(clampView(scale, e.clientX - dragRef.current.x, e.clientY - dragRef.current.y));
  }, [clampView]);

  const handlePointerUp = useCallback((e) => {
    try { e.currentTarget.releasePointerCapture(e.pointerId); } catch { /* not captured */ }
    dragRef.current = null;
    setIsDragging(false);
  }, []);

  // wheel = zoom in / out toward the cursor. A native listener, because
  // React's wheel handler is passive and can't stop the page scrolling.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return undefined;
    const onWheel = (e) => {
      if (thumbnailStripRef.current?.contains(e.target)) return;   // let the strip scroll
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0015);
      zoomTo(viewRef.current.scale * factor, e.clientX, e.clientY);
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [zoomTo]);

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
      className="lightbox"
    >
      <div className="lightbox-bar">
        <div className="lightbox-count">
          {currentImageIndex + 1} / {images.length}
        </div>
        <div className="lightbox-tools">
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

      <div className={`lightbox-stage${showTimeline ? " has-timeline" : ""}`}>
        <button
          className="lightbox-nav-button is-prev"
          onClick={handlePrevious}
        >
          <ChevronLeft size={32} />
        </button>
        <div
          ref={imageRef}
          style={{
            transition: isDragging ? 'none' : 'transform 0.18s ease-out',
            transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
            cursor: isZoomed ? (isDragging ? 'grabbing' : 'grab') : 'zoom-in',
          }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onDragStart={(e) => e.preventDefault()}
          onDoubleClick={(e) => (isZoomed ? resetZoomAndPosition() : zoomTo(2.5, e.clientX, e.clientY))}
        >
          <img
                draggable={false}
            src={images[currentImageIndex].url}
            alt={images[currentImageIndex].alt}
            className="lightbox-image"
          />
        </div>
        <button
          className="lightbox-nav-button is-next"
          onClick={handleNext}
        >
          <ChevronRight size={32} />
        </button>
      </div>
      {showTimeline && (
        <div
          ref={thumbnailStripRef}
          className="lightbox-strip"
        >
          {images.map((image, index) => (
            <button
              key={image.id}
              data-index={index}
              onClick={() => {
                setCurrentImageIndex(index);
                resetZoomAndPosition();
              }}
              className={`lightbox-thumb${index === currentImageIndex ? " is-active" : ""}`}
            >
              <img
                draggable={false}
                src={image.thumbnail}
                alt={`Thumbnail ${index + 1}`}
              />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

/* Looks: common/styles/pages/art.css
   Sizes: platforms/<device>/art.css (gallery columns live there) */
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
    <div className="art-page">
      <div className="art-head">
        <h1 className="art-title">AI Canvas 🖌️🎨</h1>
        <BackHome />
      </div>

      <div className="gallery-container">
        {images.map((image, index) => (
          <div
            key={image.id}
            className="gallery-item"
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
                draggable={false}
                  className="gallery-image"
                  src={image.thumbnail}
                  alt={image.alt}
                  loading="lazy"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="art-foot">
        <p>
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
