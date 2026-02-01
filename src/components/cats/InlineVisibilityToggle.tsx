'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface InlineVisibilityToggleProps {
  catId: string;
  isPublic: boolean;
}

export default function InlineVisibilityToggle({
  catId,
  isPublic: initialIsPublic,
}: InlineVisibilityToggleProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const supabase = createClient();

  const handleToggle = async () => {
    const previousState = isPublic;
    const newState = !isPublic;

    // Optimistic update
    setIsPublic(newState);

    startTransition(async () => {
      try {
        const { error } = await supabase
          .from('cats')
          .update({ is_public: newState })
          .eq('id', catId);

        if (error) throw error;
        router.refresh();
      } catch (err) {
        console.error('Error toggling visibility:', err);
        setIsPublic(previousState);
      }
    });
  };

  return (
    <button
      type="button"
      onClick={handleToggle}
      disabled={isPending}
      className={`
        inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium
        transition-colors cursor-pointer
        ${isPublic
          ? 'bg-green-100 text-green-700 hover:bg-green-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
        }
        ${isPending ? 'opacity-50 cursor-wait' : ''}
      `}
      title={isPublic ? 'Click to make private' : 'Click to make public'}
    >
      {isPending ? (
        <svg className="animate-spin h-3 w-3 mr-1" viewBox="0 0 24 24">
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
      ) : null}
      {isPublic ? 'Public' : 'Private'}
    </button>
  );
}
