'use client';

import Image from 'next/image';
import Link from 'next/link';

interface CatAvatarProps {
  catId: string;
  name: string;
  imageUrl: string | null;
  size?: 'sm' | 'md' | 'lg';
  showName?: boolean;
  linkToProfile?: boolean;
}

const sizeClasses = {
  sm: 'w-8 h-8',
  md: 'w-10 h-10',
  lg: 'w-14 h-14',
};

const textSizes = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export default function CatAvatar({
  catId,
  name,
  imageUrl,
  size = 'md',
  showName = false,
  linkToProfile = true,
}: CatAvatarProps) {
  const avatar = (
    <div className="flex items-center gap-2">
      <div
        className={`relative ${sizeClasses[size]} rounded-full overflow-hidden border-2 border-orange-200 bg-orange-50 flex-shrink-0`}
      >
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-sm">
            🐱
          </div>
        )}
      </div>
      {showName && (
        <span className={`font-medium text-gray-900 ${textSizes[size]}`}>
          {name}
        </span>
      )}
    </div>
  );

  if (linkToProfile) {
    return (
      <Link
        href={`/cats/${catId}/public`}
        className="inline-flex hover:opacity-80 transition-opacity"
      >
        {avatar}
      </Link>
    );
  }

  return avatar;
}
