import React from 'react';
import { cn } from '@/components/utils/cn';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  containerClassName?: string;
  fallback?: React.ReactNode;
  aspectRatio?: 'square' | 'video' | 'portrait' | 'landscape' | 'auto';
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  hoverEffect?: boolean;
}

export function ResponsiveImage({
  src,
  alt,
  className = '',
  containerClassName = '',
  fallback,
  aspectRatio = 'square',
  objectFit = 'contain',
  hoverEffect = true,
}: ResponsiveImageProps) {
  const aspectRatioClasses = {
    square: 'aspect-square',
    video: 'aspect-video',
    portrait: 'aspect-[3/4]',
    landscape: 'aspect-[4/3]',
    auto: '',
  };

  const objectFitClasses = {
    contain: 'object-contain',
    cover: 'object-cover',
    fill: 'object-fill',
    none: 'object-none',
    'scale-down': 'object-scale-down',
  };

  const hoverClasses = hoverEffect 
    ? 'hover:scale-105 transition-transform duration-200' 
    : '';

  return (
    <div 
      className={cn(
        'bg-gray-100 flex items-center justify-center overflow-hidden rounded-lg',
        aspectRatioClasses[aspectRatio],
        containerClassName
      )}
    >
      {src ? (
        <img
          src={src}
          alt={alt}
          className={cn(
            'w-full h-full',
            objectFitClasses[objectFit],
            hoverClasses,
            className
          )}
          loading="lazy"
        />
      ) : (
        fallback || (
          <div className="text-gray-400 text-center p-4">
            <div className="text-4xl mb-2">📦</div>
            <div className="text-sm">ไม่มีรูปภาพ</div>
          </div>
        )
      )}
    </div>
  );
}
