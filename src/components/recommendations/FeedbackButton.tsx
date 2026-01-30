'use client';

import { RecommendationFeedback } from '@/types';

interface FeedbackButtonProps {
  existingFeedback?: RecommendationFeedback | null;
  onOpenFeedback: () => void;
  disabled?: boolean;
}

const feedbackEmojis: Record<string, string> = {
  purchased: '🛒',
  tried: '🍽️',
  interested: '👍',
  not_interested: '👎',
};

export default function FeedbackButton({
  existingFeedback,
  onOpenFeedback,
  disabled,
}: FeedbackButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation();
        if (!disabled) onOpenFeedback();
      }}
      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
        disabled
          ? 'bg-gray-100 text-gray-400 cursor-not-allowed opacity-50'
          : existingFeedback
            ? 'bg-orange-100 text-orange-700 hover:bg-orange-200'
            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      {existingFeedback ? (
        <>
          <span>{feedbackEmojis[existingFeedback.feedback_type]}</span>
          <span>
            {existingFeedback.rating ? `${existingFeedback.rating}★` : 'Feedback'}
          </span>
        </>
      ) : (
        <>
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
            />
          </svg>
          <span>Feedback</span>
        </>
      )}
    </button>
  );
}
