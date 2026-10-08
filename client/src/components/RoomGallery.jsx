import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, ImageOff, X } from 'lucide-react';

function RoomGalleryImage({ src, alt, className, loading = 'lazy', fit = 'cover' }) {
  const [loadedSrc, setLoadedSrc] = useState('');
  const [failedSrc, setFailedSrc] = useState('');
  const loaded = loadedSrc === src;
  const failed = failedSrc === src;

  return (
    <div className={`relative overflow-hidden bg-stone-100 ${className}`}>
      {!loaded && !failed && (
        <div className="absolute inset-0 animate-pulse bg-stone-200" />
      )}
      {failed ? (
        <div
          role="img"
          aria-label={alt}
          className="flex h-full w-full flex-col items-center justify-center gap-2 bg-stone-100 text-stone-400"
        >
          <ImageOff className="h-6 w-6" />
          <span className="text-xs">Photo unavailable</span>
        </div>
      ) : (
        <img
          src={src}
          alt={alt}
          loading={loading}
          onLoad={() => setLoadedSrc(src)}
          onError={() => setFailedSrc(src)}
          className={`h-full w-full ${fit === 'contain' ? 'object-contain' : 'object-cover'} transition-[filter,opacity] duration-300 ${
            loaded ? 'blur-0 opacity-100' : 'scale-[1.02] blur-sm opacity-70'
          }`}
        />
      )}
    </div>
  );
}

export function RoomGallery({ images, roomNumber, getImageUrl }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const touchStartXRef = useRef(null);

  const openGallery = () => {
    previousFocusRef.current = document.activeElement;
    setActiveIndex(0);
    setIsOpen(true);
  };

  const closeGallery = () => setIsOpen(false);
  const showPrevious = () => {
    setActiveIndex((index) => (index - 1 + images.length) % images.length);
  };
  const showNext = () => {
    setActiveIndex((index) => (index + 1) % images.length);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        closeGallery();
      } else if (event.key === 'ArrowLeft' && images.length > 1) {
        event.preventDefault();
        showPrevious();
      } else if (event.key === 'ArrowRight' && images.length > 1) {
        event.preventDefault();
        showNext();
      } else if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll(
          'button:not([disabled])'
        );
        if (!focusable?.length) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, images.length]);

  useEffect(() => {
    if (!isOpen || images.length < 2) return;

    [
      (activeIndex - 1 + images.length) % images.length,
      (activeIndex + 1) % images.length,
    ].forEach((index) => {
      const image = new Image();
      image.src = getImageUrl(images[index].url, 'w_1600');
    });
  }, [activeIndex, getImageUrl, images, isOpen]);

  if (!images.length) return null;

  return (
    <>
      <div className="relative aspect-[16/10] w-full shrink-0 overflow-hidden rounded-2xl bg-stone-100 md:aspect-auto md:h-[150px] md:w-[220px]">
        <button
          type="button"
          onClick={openGallery}
          className="absolute inset-0 h-full w-full overflow-hidden text-left focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
          aria-label={`View photos for Room ${roomNumber}`}
        >
          <RoomGalleryImage
            src={getImageUrl(images[0].url, 'w_600,h_400,c_fill')}
            alt={`Room ${roomNumber} photo 1`}
            className="h-full w-full"
          />
          {images.length > 1 && (
            <span className="absolute bottom-3 left-3 rounded-lg bg-stone-950/80 px-2.5 py-1.5 text-xs font-bold text-white">
              +{images.length - 1} photos
            </span>
          )}
        </button>
      </div>

      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Room ${roomNumber} photo gallery`}
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 text-white sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) closeGallery();
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={closeGallery}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25"
            aria-label="Close gallery"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-3 text-sm font-semibold text-white/80" aria-live="polite">
            {activeIndex + 1} / {images.length}
          </div>

          <div
            className="relative flex min-h-0 w-full flex-1 items-center justify-center"
            onTouchStart={(event) => {
              touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
            }}
            onTouchEnd={(event) => {
              if (touchStartXRef.current === null || images.length < 2) return;
              const distance = event.changedTouches[0].clientX - touchStartXRef.current;
              if (Math.abs(distance) > 50) {
                distance < 0 ? showNext() : showPrevious();
              }
              touchStartXRef.current = null;
            }}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 sm:left-3"
                aria-label="Previous photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}

            <RoomGalleryImage
              key={images[activeIndex].url}
              src={getImageUrl(images[activeIndex].url, 'w_1600')}
              alt={`Room ${roomNumber} photo ${activeIndex + 1}`}
              loading="eager"
              fit="contain"
              className="h-full max-h-[calc(100vh-12rem)] w-full max-w-full rounded-xl"
            />

            {images.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                className="absolute right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 transition hover:bg-white/25 sm:right-3"
                aria-label="Next photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>

          {images.length > 1 && (
            <div className="mt-4 flex max-w-full gap-2 overflow-x-auto pb-1" aria-label="Gallery thumbnails">
              {images.map((image, index) => (
                <button
                  key={image.id || `${image.url}-${index}`}
                  type="button"
                  onClick={() => setActiveIndex(index)}
                  aria-label={`Show photo ${index + 1}`}
                  aria-current={index === activeIndex ? 'true' : undefined}
                  className={`h-14 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                    index === activeIndex
                      ? 'border-amber-400'
                      : 'border-transparent opacity-70 hover:opacity-100'
                  }`}
                >
                  <RoomGalleryImage
                    src={getImageUrl(image.url, 'w_200,h_200,c_fill')}
                    alt={`Room ${roomNumber} photo ${index + 1}`}
                    className="h-full w-full"
                  />
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </>
  );
}

export function RoomDetailGallery({ images, roomNumber, getImageUrl }) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const dialogRef = useRef(null);
  const closeButtonRef = useRef(null);
  const previousFocusRef = useRef(null);
  const touchStartXRef = useRef(null);

  const showPrevious = () => {
    setActiveIndex((index) => (index - 1 + images.length) % images.length);
  };
  const showNext = () => {
    setActiveIndex((index) => (index + 1) % images.length);
  };

  useEffect(() => {
    if (!isOpen) return undefined;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    closeButtonRef.current?.focus();

    const handleKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      } else if (event.key === 'ArrowLeft' && images.length > 1) {
        event.preventDefault();
        showPrevious();
      } else if (event.key === 'ArrowRight' && images.length > 1) {
        event.preventDefault();
        showNext();
      } else if (event.key === 'Tab') {
        const focusable = dialogRef.current?.querySelectorAll('button:not([disabled])');
        if (!focusable?.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.body.style.overflow = originalOverflow;
      document.removeEventListener('keydown', handleKeyDown);
      previousFocusRef.current?.focus?.();
    };
  }, [isOpen, images.length]);

  useEffect(() => {
    if (images.length < 2) return;
    [
      (activeIndex - 1 + images.length) % images.length,
      (activeIndex + 1) % images.length,
    ].forEach((index) => {
      const image = new Image();
      image.src = getImageUrl(images[index].url, 'w_1600');
    });
  }, [activeIndex, getImageUrl, images]);

  const handleTouchStart = (event) => {
    touchStartXRef.current = event.changedTouches[0]?.clientX ?? null;
  };
  const handleTouchEnd = (event) => {
    if (touchStartXRef.current === null || images.length < 2) return;
    const distance = event.changedTouches[0].clientX - touchStartXRef.current;
    if (Math.abs(distance) > 50) {
      distance < 0 ? showNext() : showPrevious();
    }
    touchStartXRef.current = null;
  };
  const openLightbox = () => {
    previousFocusRef.current = document.activeElement;
    setIsOpen(true);
  };

  if (!images.length) return null;

  return (
    <>
      <div className="space-y-3">
        <div
          className="relative aspect-[16/10] overflow-hidden rounded-2xl bg-stone-100"
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <button
            type="button"
            onClick={openLightbox}
            className="absolute inset-0 h-full w-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-amber-500"
            aria-label={`Open photo ${activeIndex + 1} for Room ${roomNumber}`}
          >
            <RoomGalleryImage
              src={getImageUrl(images[activeIndex].url, 'w_1400')}
              alt={`Room ${roomNumber} photo ${activeIndex + 1}`}
              className="h-full w-full"
            />
          </button>
          {images.length > 1 && (
            <>
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-stone-950/70 text-white hover:bg-stone-950"
                aria-label="Previous room photo"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                type="button"
                onClick={showNext}
                className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-stone-950/70 text-white hover:bg-stone-950"
                aria-label="Next room photo"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </>
          )}
          <span className="absolute bottom-3 right-3 rounded-lg bg-stone-950/75 px-2.5 py-1.5 text-xs font-bold text-white">
            {activeIndex + 1} / {images.length}
          </span>
        </div>

        {images.length > 1 && (
          <div className="flex gap-2 overflow-x-auto pb-1" aria-label="Room photo thumbnails">
            {images.map((image, index) => (
              <button
                key={image.id || `${image.url}-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                aria-label={`Show room photo ${index + 1}`}
                aria-current={index === activeIndex ? 'true' : undefined}
                className={`h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  index === activeIndex ? 'border-amber-500' : 'border-transparent opacity-75 hover:opacity-100'
                }`}
              >
                <RoomGalleryImage
                  src={getImageUrl(image.url, 'w_200,h_200,c_fill')}
                  alt={`Room ${roomNumber} photo ${index + 1}`}
                  className="h-full w-full"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {isOpen && (
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-label={`Room ${roomNumber} photo gallery`}
          tabIndex={-1}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black/95 p-4 text-white sm:p-6"
          onClick={(event) => {
            if (event.target === event.currentTarget) setIsOpen(false);
          }}
        >
          <button
            ref={closeButtonRef}
            type="button"
            onClick={() => setIsOpen(false)}
            className="absolute right-4 top-4 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25"
            aria-label="Close room photo gallery"
          >
            <X className="h-5 w-5" />
          </button>
          <div className="mb-3 text-sm font-semibold text-white/80" aria-live="polite">
            {activeIndex + 1} / {images.length}
          </div>
          <div
            className="relative flex min-h-0 w-full flex-1 items-center justify-center"
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            {images.length > 1 && (
              <button
                type="button"
                onClick={showPrevious}
                className="absolute left-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 sm:left-3"
                aria-label="Previous room photo"
              >
                <ChevronLeft className="h-6 w-6" />
              </button>
            )}
            <RoomGalleryImage
              key={images[activeIndex].url}
              src={getImageUrl(images[activeIndex].url, 'w_1600')}
              alt={`Room ${roomNumber} photo ${activeIndex + 1}`}
              loading="eager"
              fit="contain"
              className="h-full max-h-[calc(100vh-12rem)] max-w-full rounded-xl"
            />
            {images.length > 1 && (
              <button
                type="button"
                onClick={showNext}
                className="absolute right-0 z-10 flex h-11 w-11 items-center justify-center rounded-full bg-white/15 hover:bg-white/25 sm:right-3"
                aria-label="Next room photo"
              >
                <ChevronRight className="h-6 w-6" />
              </button>
            )}
          </div>
        </div>
      )}
    </>
  );
}