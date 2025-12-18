import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';

interface ImageHoverPreviewProps {
  src: string;
  alt?: string;
  className?: string;
  thumbnailClassName?: string;
  children?: React.ReactNode;
}

const ImageHoverPreview: React.FC<ImageHoverPreviewProps> = ({
  src,
  alt = 'Preview',
  className = '',
  thumbnailClassName = 'w-7 h-7 rounded-lg border border-neutral-200/80 overflow-hidden bg-neutral-100',
  children
}) => {
  const [showPreview, setShowPreview] = useState(false);
  const [previewPosition, setPreviewPosition] = useState<{ top: number; left: number }>({ top: 0, left: 0 });
  const [imageError, setImageError] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (showPreview && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      // Set initial position; will be adjusted after preview renders
      setPreviewPosition({ top: rect.top, left: rect.left - 20 });
    }
  }, [showPreview]);

  // Adjust position after preview renders to account for actual size
  useEffect(() => {
    if (showPreview && previewRef.current && containerRef.current) {
      const previewRect = previewRef.current.getBoundingClientRect();
      const containerRect = containerRef.current.getBoundingClientRect();
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      const margin = 10;

      let left: number;
      let top: number;

      // Calculate available space on each side
      const spaceLeft = containerRect.left - margin;
      const spaceRight = viewportWidth - containerRect.right - margin;
      const spaceTop = containerRect.top - margin;
      const spaceBottom = viewportHeight - containerRect.bottom - margin;

      // Horizontal positioning: prefer left, fallback to right, then center
      if (spaceLeft >= previewRect.width) {
        left = containerRect.left - previewRect.width - margin;
      } else if (spaceRight >= previewRect.width) {
        left = containerRect.right + margin;
      } else {
        // Center horizontally if neither side fits
        left = Math.max(margin, (viewportWidth - previewRect.width) / 2);
      }

      // Vertical positioning: try to align with container, then adjust to fit
      if (spaceBottom >= previewRect.height) {
        // Enough space below - align top with container
        top = containerRect.top;
      } else if (spaceTop >= previewRect.height) {
        // Enough space above - align bottom with container
        top = containerRect.bottom - previewRect.height;
      } else {
        // Not enough space above or below - center vertically
        top = Math.max(margin, (viewportHeight - previewRect.height) / 2);
      }

      // Final bounds check to ensure preview stays within viewport
      if (left < margin) left = margin;
      if (left + previewRect.width > viewportWidth - margin) {
        left = viewportWidth - previewRect.width - margin;
      }
      if (top < margin) top = margin;
      if (top + previewRect.height > viewportHeight - margin) {
        top = viewportHeight - previewRect.height - margin;
      }

      setPreviewPosition({ top, left });
    }
  }, [showPreview, src, imageLoaded]);

  const handleMouseEnter = () => {
    if (src && !imageError) {
      setShowPreview(true);
    }
  };

  const handleMouseLeave = () => {
    setShowPreview(false);
    setImageLoaded(false);
  };

  const handleImageError = () => {
    setImageError(true);
    setShowPreview(false);
  };

  // Reset error state when src changes
  useEffect(() => {
    setImageError(false);
  }, [src]);

  if (!src) return null;

  return (
    <>
      <div
        ref={containerRef}
        className={`${thumbnailClassName} ${className} cursor-pointer`}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {children || (
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              setImageError(true);
            }}
          />
        )}
      </div>

      {showPreview && !imageError && createPortal(
        <div
          ref={previewRef}
          className="fixed bg-white rounded-xl shadow-2xl border border-neutral-200 p-2 pointer-events-none"
          style={{
            top: previewPosition.top,
            left: previewPosition.left,
            maxHeight: '80vh',
            maxWidth: '80vw',
            zIndex: 2147483647,
            isolation: 'isolate',
          }}
        >
          <img
            src={src}
            alt={alt}
            className="max-h-[calc(80vh-16px)] max-w-[calc(80vw-16px)] object-contain rounded"
            onLoad={() => setImageLoaded(true)}
            onError={handleImageError}
          />
        </div>,
        document.body
      )}
    </>
  );
};

export default ImageHoverPreview;
