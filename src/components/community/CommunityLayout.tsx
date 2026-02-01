'use client';

import { ReactNode } from 'react';
import CommunityTabs from './CommunityTabs';

interface CommunityLayoutProps {
  children: ReactNode;
}

export default function CommunityLayout({ children }: CommunityLayoutProps) {
  return (
    <div className="animate-fade-in">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Community</h1>
        <p className="text-gray-600">
          Discover meal plans shared by cats and connect with the MealMeow community
        </p>
      </div>

      <CommunityTabs />

      <div className="mt-6">{children}</div>
    </div>
  );
}
