'use client';

import { useState, useTransition } from 'react';
import { createClient } from '@/lib/supabase/client';
import Button from '@/components/ui/Button';

interface FollowButtonProps {
  catId: string;
  isFollowing: boolean;
  onFollowChange?: (isFollowing: boolean) => void;
  size?: 'sm' | 'md';
}

export default function FollowButton({
  catId,
  isFollowing: initialIsFollowing,
  onFollowChange,
  size = 'md',
}: FollowButtonProps) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  const handleClick = async () => {
    const previousState = isFollowing;
    const newState = !isFollowing;

    // Optimistic update
    setIsFollowing(newState);
    onFollowChange?.(newState);

    startTransition(async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Not logged in');
        }

        if (newState) {
          // Follow
          const { error } = await supabase.from('cat_follows').insert({
            follower_user_id: user.id,
            followed_cat_id: catId,
          });

          if (error) throw error;
        } else {
          // Unfollow
          const { error } = await supabase
            .from('cat_follows')
            .delete()
            .eq('follower_user_id', user.id)
            .eq('followed_cat_id', catId);

          if (error) throw error;
        }
      } catch (err) {
        // Revert on error
        console.error('Error toggling follow:', err);
        setIsFollowing(previousState);
        onFollowChange?.(previousState);
      }
    });
  };

  return (
    <Button
      variant={isFollowing ? 'secondary' : 'primary'}
      size={size}
      onClick={handleClick}
      disabled={isPending}
      className={isFollowing ? 'min-w-[100px]' : 'min-w-[100px]'}
    >
      {isPending ? (
        <span className="flex items-center gap-1">
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
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
        </span>
      ) : isFollowing ? (
        'Following'
      ) : (
        'Follow'
      )}
    </Button>
  );
}
