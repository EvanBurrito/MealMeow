import { createClient } from './supabase/client';
import { AnalyticsEventType } from '@/types';

/**
 * Generate or retrieve session ID for analytics tracking
 */
function getSessionId(): string {
  if (typeof window === 'undefined') return '';

  let sessionId = sessionStorage.getItem('mealmeow_session_id');
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem('mealmeow_session_id', sessionId);
  }
  return sessionId;
}

/**
 * Track an analytics event
 */
export async function trackEvent(
  eventType: AnalyticsEventType,
  data: {
    userId?: string;
    catId?: string;
    foodId?: string;
    eventData?: Record<string, unknown>;
  }
): Promise<void> {
  const supabase = createClient();

  try {
    await supabase.from('analytics_events').insert({
      user_id: data.userId || null,
      cat_id: data.catId || null,
      food_id: data.foodId || null,
      event_type: eventType,
      event_data: data.eventData || {},
      session_id: getSessionId(),
    });
  } catch (error) {
    // Fail silently - analytics should never break the app
    console.error('Analytics tracking error:', error);
  }
}

/**
 * Track recommendation page view
 */
export async function trackRecommendationView(
  userId: string,
  catId: string,
  foodIds: string[],
  filters: Record<string, unknown>
): Promise<void> {
  await trackEvent('recommendation_view', {
    userId,
    catId,
    eventData: {
      foodIds,
      filters,
      viewedAt: new Date().toISOString(),
      foodCount: foodIds.length,
    },
  });
}

/**
 * Track food recommendation click
 */
export async function trackFoodClick(
  userId: string,
  catId: string,
  foodId: string,
  position: number,
  score: number
): Promise<void> {
  await trackEvent('recommendation_click', {
    userId,
    catId,
    foodId,
    eventData: {
      position,
      score,
      clickedAt: new Date().toISOString(),
    },
  });
}

/**
 * Track filter change
 */
export async function trackFilterChange(
  userId: string,
  catId: string,
  filterType: string,
  filterValue: unknown
): Promise<void> {
  await trackEvent('filter_change', {
    userId,
    catId,
    eventData: {
      filterType,
      filterValue,
      changedAt: new Date().toISOString(),
    },
  });
}

/**
 * Track feedback submission
 */
export async function trackFeedbackSubmitted(
  userId: string,
  catId: string,
  foodId: string,
  feedbackType: string,
  rating: number | null
): Promise<void> {
  await trackEvent('feedback_submitted', {
    userId,
    catId,
    foodId,
    eventData: {
      feedbackType,
      rating,
      submittedAt: new Date().toISOString(),
    },
  });
}
