'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { RecommendationFeedback, CatFood, FeedbackType } from '@/types';
import Header from '@/components/layout/Header';
import AdminLayout from '@/components/admin/AdminLayout';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';

interface FeedbackWithDetails extends RecommendationFeedback {
  food?: CatFood;
  cat_name?: string;
  user_email?: string;
}

const FEEDBACK_TYPES: { value: FeedbackType | 'all'; label: string }[] = [
  { value: 'all', label: 'All Types' },
  { value: 'purchased', label: 'Purchased' },
  { value: 'tried', label: 'Tried' },
  { value: 'interested', label: 'Interested' },
  { value: 'not_interested', label: 'Not Interested' },
];

const RATING_OPTIONS = [
  { value: 'all', label: 'All Ratings' },
  { value: '5', label: '5 Stars' },
  { value: '4', label: '4 Stars' },
  { value: '3', label: '3 Stars' },
  { value: '2', label: '2 Stars' },
  { value: '1', label: '1 Star' },
];

export default function AdminFeedbackPage() {
  const router = useRouter();
  const supabase = createClient();
  const [feedback, setFeedback] = useState<FeedbackWithDetails[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  // Filters
  const [typeFilter, setTypeFilter] = useState<FeedbackType | 'all'>('all');
  const [ratingFilter, setRatingFilter] = useState<string>('all');
  const [foodFilter, setFoodFilter] = useState<string>('all');

  // Available foods for filter
  const [foods, setFoods] = useState<CatFood[]>([]);

  useEffect(() => {
    async function loadData() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Check if user is admin
        const { data: profile } = await supabase
          .from('profiles')
          .select('is_admin')
          .eq('id', user.id)
          .single();

        if (!profile?.is_admin) {
          router.push('/dashboard');
          return;
        }

        setIsAdmin(true);

        // Load all feedback
        const { data: feedbackData, error: feedbackError } = await supabase
          .from('recommendation_feedback')
          .select('*')
          .order('created_at', { ascending: false });

        if (feedbackError) throw feedbackError;

        // Load related data
        const foodIds = [...new Set(feedbackData?.map((f) => f.food_id) || [])];
        const catIds = [...new Set(feedbackData?.map((f) => f.cat_id) || [])];
        const userIds = [...new Set(feedbackData?.map((f) => f.user_id) || [])];

        const [foodsResult, catsResult, profilesResult] = await Promise.all([
          supabase.from('cat_foods').select('*').in('id', foodIds),
          supabase.from('cats').select('id, name').in('id', catIds),
          supabase.from('profiles').select('id, email').in('id', userIds),
        ]);

        const foodMap = new Map(foodsResult.data?.map((f) => [f.id, f]) || []);
        const catMap = new Map(catsResult.data?.map((c) => [c.id, c.name]) || []);
        const profileMap = new Map(profilesResult.data?.map((p) => [p.id, p.email]) || []);

        // Combine data
        const enrichedFeedback: FeedbackWithDetails[] = (feedbackData || []).map((f) => ({
          ...f,
          food: foodMap.get(f.food_id),
          cat_name: catMap.get(f.cat_id),
          user_email: profileMap.get(f.user_id),
        }));

        setFeedback(enrichedFeedback);
        setFoods(foodsResult.data || []);
      } catch (err: unknown) {
        console.error('Error loading feedback:', err);
        setError('Failed to load feedback');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router, supabase]);

  // Filter feedback
  const filteredFeedback = feedback.filter((f) => {
    if (typeFilter !== 'all' && f.feedback_type !== typeFilter) return false;
    if (ratingFilter !== 'all' && f.rating !== parseInt(ratingFilter)) return false;
    if (foodFilter !== 'all' && f.food_id !== foodFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn isAdmin />
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">🐱</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminLayout>
          <div className="animate-fade-in">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">User Feedback</h1>
              <p className="text-gray-600 mt-1">
                Review feedback from users on food recommendations
              </p>
            </div>

            {/* Filters */}
            <Card variant="bordered" className="mb-6">
              <div className="flex flex-wrap gap-4">
                <div className="w-40">
                  <Select
                    label="Feedback Type"
                    value={typeFilter}
                    onChange={(e) => setTypeFilter(e.target.value as FeedbackType | 'all')}
                    options={FEEDBACK_TYPES}
                  />
                </div>
                <div className="w-32">
                  <Select
                    label="Rating"
                    value={ratingFilter}
                    onChange={(e) => setRatingFilter(e.target.value)}
                    options={RATING_OPTIONS}
                  />
                </div>
                <div className="w-64">
                  <Select
                    label="Food"
                    value={foodFilter}
                    onChange={(e) => setFoodFilter(e.target.value)}
                    options={[
                      { value: 'all', label: 'All Foods' },
                      ...foods.map((food) => ({
                        value: food.id,
                        label: `${food.brand} - ${food.product_name}`,
                      })),
                    ]}
                  />
                </div>
              </div>
            </Card>

            {/* Results Count */}
            <p className="text-sm text-gray-500 mb-4">
              Showing {filteredFeedback.length} of {feedback.length} feedback entries
            </p>

            {error && (
              <Card variant="bordered" className="text-center py-8 mb-6">
                <p className="text-red-600">{error}</p>
              </Card>
            )}

            {filteredFeedback.length === 0 && !error && (
              <Card variant="bordered" className="text-center py-12">
                <div className="text-6xl mb-4">💬</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">No Feedback Found</h3>
                <p className="text-gray-600">
                  {feedback.length === 0
                    ? 'No users have submitted feedback yet.'
                    : 'No feedback matches your filters.'}
                </p>
              </Card>
            )}

            {filteredFeedback.length > 0 && (
              <div className="space-y-4">
                {filteredFeedback.map((item) => (
                  <Card key={item.id} variant="bordered" className="animate-fade-in">
                    <div className="flex flex-col lg:flex-row lg:items-start gap-4">
                      {/* Food Info */}
                      <div className="flex-1">
                        <div className="flex items-start gap-3 mb-2">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-900">
                              {item.food
                                ? `${item.food.brand} ${item.food.product_name}`
                                : 'Unknown food'}
                            </h3>
                            {item.food && (
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-xs font-medium ${
                                  item.food.food_type === 'dry'
                                    ? 'bg-amber-100 text-amber-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}
                              >
                                {item.food.food_type === 'dry' ? 'Dry' : 'Wet'}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Rating */}
                        {item.rating && (
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-lg text-yellow-500">
                              {'★'.repeat(item.rating)}
                              {'☆'.repeat(5 - item.rating)}
                            </span>
                            <span className="text-sm text-gray-500">({item.rating}/5)</span>
                          </div>
                        )}

                        {/* Feedback Type Badge */}
                        <span
                          className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${
                            item.feedback_type === 'purchased'
                              ? 'bg-green-100 text-green-700'
                              : item.feedback_type === 'tried'
                              ? 'bg-blue-100 text-blue-700'
                              : item.feedback_type === 'interested'
                              ? 'bg-orange-100 text-orange-700'
                              : 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {item.feedback_type.replace('_', ' ')}
                        </span>

                        {/* Comment */}
                        {item.comment && (
                          <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-700">&quot;{item.comment}&quot;</p>
                          </div>
                        )}

                        {/* Additional Details */}
                        <div className="mt-3 flex flex-wrap gap-4 text-sm text-gray-500">
                          {item.cat_liked !== null && (
                            <span>
                              Cat liked: {item.cat_liked ? '✅ Yes' : '❌ No'}
                            </span>
                          )}
                          {item.would_repurchase !== null && (
                            <span>
                              Would repurchase: {item.would_repurchase ? '✅ Yes' : '❌ No'}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* User/Cat Info */}
                      <div className="lg:w-48 text-sm text-gray-500 lg:text-right">
                        <p className="font-medium text-gray-700">
                          {item.user_email || 'Unknown user'}
                        </p>
                        {item.cat_name && <p>Cat: {item.cat_name}</p>}
                        <p className="mt-1">
                          {new Date(item.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </AdminLayout>
      </div>
    </div>
  );
}
