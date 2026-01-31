'use client';

import { useState } from 'react';
import Image from 'next/image';
import { isValidImageUrl, isWhitelistedImageUrl } from '@/lib/validation';

interface SafeImagePreviewProps {
  src: string;
  alt: string;
  className?: string;
  width?: number;
  height?: number;
  fill?: boolean;
}

export default function SafeImagePreview({
  src,
  alt,
  className = '',
  width,
  height,
  fill = false,
}: SafeImagePreviewProps) {
  const [hasError, setHasError] = useState(false);

  // Show placeholder for empty or invalid URLs
  if (!src || !isValidImageUrl(src) || hasError) {
    return (
      <div
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${
          fill ? 'absolute inset-0' : ''
        } ${className}`}
        style={!fill ? { width: width || 96, height: height || 96 } : undefined}
      >
        <svg
          className="w-8 h-8"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
      </div>
    );
  }

  // Use Next.js Image for whitelisted URLs
  if (isWhitelistedImageUrl(src)) {
    if (fill) {
      return (
        <Image
          src={src}
          alt={alt}
          fill
          className={className}
          onError={() => setHasError(true)}
        />
      );
    }

    return (
      <Image
        src={src}
        alt={alt}
        width={width || 96}
        height={height || 96}
        className={className}
        onError={() => setHasError(true)}
      />
    );
  }

  // Use regular img for non-whitelisted but valid URLs
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className={className}
      style={!fill ? { width, height } : { width: '100%', height: '100%', objectFit: 'cover' }}
      onError={() => setHasError(true)}
    />
  );
}
