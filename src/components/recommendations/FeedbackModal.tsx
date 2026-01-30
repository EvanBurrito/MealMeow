'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { FeedbackType, RecommendationFeedback, CatFood } from '@/types';
import { trackFeedbackSubmitted } from '@/lib/analytics';
import Button from '@/components/ui/Button';

interface FeedbackModalProps {
  isOpen: boolean;
  food: CatFood | null;
  catId: string;
  userId: string;
  existingFeedback?: RecommendationFeedback | null;
  onClose: () => void;
  onSaved: (feedback: RecommendationFeedback) => void;
}

const FEEDBACK_OPTIONS: { value: FeedbackType; label: string; emoji: string }[] = [
  { value: 'purchased', label: 'Purchased', emoji: '🛒' },
  { value: 'tried', label: 'Tried It', emoji: '🍽️' },
  { value: 'interested', label: 'Interested', emoji: '👍' },
  { value: 'not_interested', label: 'Not Interested', emoji: '👎' },
];

export default function FeedbackModal({
  isOpen,
  food,
  catId,
  userId,
  existingFeedback,
  onClose,
  onSaved,
}: FeedbackModalProps) {
  const supabase = createClient();
  const [isClosing, setIsClosing] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [feedbackType, setFeedbackType] = useState<FeedbackType>(
    existingFeedback?.feedback_type || 'interested'
  );
  const [rating, setRating] = useState<number | null>(existingFeedback?.rating || null);
  const [catLiked, setCatLiked] = useState<boolean | null>(existingFeedback?.cat_liked ?? null);
  const [wouldRepurchase, setWouldRepurchase] = useState<boolean | null>(
    existingFeedback?.would_repurchase ?? null
  );
  const [comment, setComment] = useState(existingFeedback?.comment || '');

  // Trigger enter animation after mount
  useEffect(() => {
    if (isOpen) {
      const raf = requestAnimationFrame(() => setIsVisible(true));
      return () => cancelAnimationFrame(raf);
    }
  }, [isOpen]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleClose = useCallback(() => {
    if (isLoading) return;
    setIsClosing(true);
    setTimeout(() => {
      setIsClosing(false);
      setIsVisible(false);
      onClose();
    }, 200);
  }, [onClose, isLoading]);

  // Handle escape key
  useEffect(() => {
    const handleEscKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isClosing && !isLoading) {
        handleClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscKey);
    }
    return () => {
      document.removeEventListener('keydown', handleEscKey);
    };
  }, [isOpen, isClosing, isLoading, handleClose]);

  if (!isOpen || !food) return null;

  const showDetailedFeedback = feedbackType === 'purchased' || feedbackType === 'tried';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const feedbackData = {
        user_id: userId,
        cat_id: catId,
        food_id: food.id,
        feedback_type: feedbackType,
        rating: showDetailedFeedback ? rating : null,
        cat_liked: showDetailedFeedback ? catLiked : null,
        would_repurchase: showDetailedFeedback ? wouldRepurchase : null,
        comment: comment.trim() || null,
      };

      let result;
      if (existingFeedback) {
        const { data, error } = await supabase
          .from('recommendation_feedback')
          .update(feedbackData)
          .eq('id', existingFeedback.id)
          .select()
          .single();
        if (error) throw error;
        result = data;
      } else {
        const { data, error } = await supabase
          .from('recommendation_feedback')
          .insert(feedbackData)
          .select()
          .single();
        if (error) throw error;
        result = data;
      }

      // Track the feedback submission
      await trackFeedbackSubmitted(userId, catId, food.id, feedbackType, rating);

      onSaved(result);
      handleClose();
    } catch (err: unknown) {
      console.error('Error saving feedback:', err);
      if (err && typeof err === 'object' && 'message' in err) {
        setError(String(err.message));
      } else {
        setError('Failed to save feedback');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-opacity duration-200 ${
        isVisible && !isClosing ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="absolute inset-0 bg-black/50"
        onClick={handleClose}
        aria-hidden="true"
      />
      <div
        className={`relative bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl border border-gray-200 transition-all duration-200 ${
          isVisible && !isClosing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Leave Feedback</h3>
              <p className="text-sm text-gray-600">
                {food.brand} - {food.product_name}
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Feedback Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                What did you do?
              </label>
              <div className="grid grid-cols-2 gap-2">
                {FEEDBACK_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setFeedbackType(option.value)}
                    className={`p-3 rounded-lg border text-sm font-medium transition-all ${
                      feedbackType === option.value
                        ? 'border-orange-500 bg-orange-50 text-orange-700'
                        : 'border-gray-200 hover:border-gray-300 text-gray-700'
                    }`}
                  >
                    <span className="text-lg mr-2">{option.emoji}</span>
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Detailed Feedback (for purchased/tried) with smooth animation */}
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                showDetailedFeedback ? 'max-h-[500px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="space-y-5 pt-1">
                {/* Star Rating */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <svg
                          className={`w-8 h-8 ${rating && rating >= star ? 'text-orange-400' : 'text-gray-300'}`}
                          fill="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                        </svg>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Cat Liked */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Did your cat like it?
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: true, label: 'Yes', emoji: '😻' },
                      { value: false, label: 'No', emoji: '😾' },
                    ].map((option) => (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => setCatLiked(option.value)}
                        className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                          catLiked === option.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        <span className="text-lg mr-2">{option.emoji}</span>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Would Repurchase */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Would you buy it again?
                  </label>
                  <div className="flex gap-2">
                    {[
                      { value: true, label: 'Yes' },
                      { value: false, label: 'No' },
                    ].map((option) => (
                      <button
                        key={String(option.value)}
                        type="button"
                        onClick={() => setWouldRepurchase(option.value)}
                        className={`flex-1 p-3 rounded-lg border text-sm font-medium transition-all ${
                          wouldRepurchase === option.value
                            ? 'border-orange-500 bg-orange-50 text-orange-700'
                            : 'border-gray-200 hover:border-gray-300 text-gray-700'
                        }`}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Comment */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Comments <span className="text-gray-400 font-normal">(optional)</span>
              </label>
              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="Share your experience..."
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 resize-none"
              />
            </div>

            {error && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <Button type="submit" isLoading={isLoading} className="flex-1">
                {existingFeedback ? 'Update Feedback' : 'Submit Feedback'}
              </Button>
              <Button type="button" variant="outline" onClick={handleClose} disabled={isLoading}>
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
