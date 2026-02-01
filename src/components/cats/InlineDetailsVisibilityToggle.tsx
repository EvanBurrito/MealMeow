'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface InlineDetailsVisibilityToggleProps {
  catId: string;
  showDetailsPublic: boolean;
}

export default function InlineDetailsVisibilityToggle({
  catId,
  showDetailsPublic: initialShowDetailsPublic,
}: InlineDetailsVisibilityToggleProps) {
  const [showDetailsPublic, setShowDetailsPublic] = useState(initialShowDetailsPublic);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleToggle = async () => {
    const previousState = showDetailsPublic;
    const newState = !showDetailsPublic;

    // Optimistic update
    setShowDetailsPublic(newState);

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('cats')
          .update({ show_details_public: newState })
          .eq('id', catId);

        if (error) {
          console.error('Supabase error toggling details visibility:', error.message, error.code, error.details);
          throw error;
        }
        router.refresh();
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message :
          (err && typeof err === 'object' && 'message' in err) ? String(err.message) : 'Unknown error';
        console.error('Error toggling details visibility:', errorMessage);
        setShowDetailsPublic(previousState);
      }
    });
  };

  return (
    <label className="inline-flex items-center gap-2 cursor-pointer">
      <span className="text-sm text-gray-600">Show to visitors</span>
      <button
        type="button"
        role="switch"
        aria-checked={showDetailsPublic}
        onClick={handleToggle}
        disabled={isPending}
        className={`
          relative inline-flex h-5 w-9 items-center rounded-full
          transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2
          ${showDetailsPublic ? 'bg-orange-500' : 'bg-gray-200'}
          ${isPending ? 'opacity-50 cursor-wait' : ''}
        `}
      >
        <span
          className={`
            inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform
            ${showDetailsPublic ? 'translate-x-4' : 'translate-x-0.5'}
          `}
        />
      </button>
      {isPending && (
        <svg className="animate-spin h-3 w-3 text-gray-400" viewBox="0 0 24 24">
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
            fill="none"
          />
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
          />
        </svg>
      )}
    </label>
  );
}
