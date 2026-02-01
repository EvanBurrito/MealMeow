'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Cat } from '@/types';
import { formatAge } from '@/lib/nutrition';
import { ACTIVITY_LEVELS } from '@/lib/constants';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface CatCardProps {
  cat: Cat;
}

export default function CatCard({ cat }: CatCardProps) {
  const genderText = cat.gender === 'male' ? 'Male' : 'Female';
  const activityLabel = ACTIVITY_LEVELS.find(a => a.value === cat.activity_level)?.label || cat.activity_level;
  const isPublic = cat.is_public ?? false;

  return (
    <Card variant="bordered" className="flex flex-col h-full">
      {/* Clickable header with profile image and name */}
      <Link href={`/cats/${cat.id}`} className="block group">
        <div className="flex items-center gap-4 mb-4">
          <div className="relative w-20 h-20 rounded-full overflow-hidden border-2 border-orange-200 bg-orange-50 flex-shrink-0 group-hover:border-orange-400 transition-colors">
            {cat.profile_image_url ? (
              <Image
                src={cat.profile_image_url}
                alt={cat.name}
                fill
                className="object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl">
                🐱
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                {cat.name}
              </h3>
              {/* Public/Private indicator */}
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                  isPublic
                    ? 'bg-green-100 text-green-700'
                    : 'bg-gray-100 text-gray-500'
                }`}
                title={isPublic ? 'Public profile' : 'Private profile'}
              >
                {isPublic ? 'Public' : 'Private'}
              </span>
            </div>
            <p className="text-gray-600 truncate">{cat.breed}</p>
          </div>
        </div>
      </Link>

      {/* Stats list */}
      <div className="space-y-2 text-sm flex-grow">
        <div className="flex justify-between">
          <span className="text-gray-500">Age</span>
          <span className="font-medium">{formatAge(cat.age_months)}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Weight</span>
          <span className="font-medium">{cat.weight_lbs} lbs</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Gender</span>
          <span className="font-medium">{genderText}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-500">Activity</span>
          <span className="font-medium text-right">{activityLabel}</span>
        </div>
      </div>

      {/* Buttons - always at bottom */}
      <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100">
        <Link href={`/cats/${cat.id}/recommendations`} className="flex-1">
          <Button className="w-full">Get Food Plan</Button>
        </Link>
        <Link href={`/cats/${cat.id}/edit`}>
          <Button variant="outline">Edit</Button>
        </Link>
      </div>
    </Card>
  );
}
