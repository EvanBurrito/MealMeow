'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { AnalyticsEvent, CatFood } from '@/types';
import Header from '@/components/layout/Header';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import Card from '@/components/ui/Card';
import Select from '@/components/ui/Select';

interface FoodStats {
  food: CatFood;
  views: number;
  clicks: number;
  feedbackCount: number;
}

type DateRange = '7d' | '30d' | '90d' | 'all';

export default function AdminAnalyticsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [error, setError] = useState('');

  const [dateRange, setDateRange] = useState<DateRange>('30d');

  // Stats
  const [totalUsers, setTotalUsers] = useState(0);
  const [totalCats, setTotalCats] = useState(0);
  const [totalRecommendationViews, setTotalRecommendationViews] = useState(0);
  const [totalFoodClicks, setTotalFoodClicks] = useState(0);

  // Popular foods
  const [popularFoods, setPopularFoods] = useState<FoodStats[]>([]);

  // Recent activity
  const [recentActivity, setRecentActivity] = useState<AnalyticsEvent[]>([]);

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

        // Calculate date filter
        let dateFilter: string | null = null;
        const now = new Date();
        if (dateRange === '7d') {
          dateFilter = new Date(now.setDate(now.getDate() - 7)).toISOString();
        } else if (dateRange === '30d') {
          dateFilter = new Date(now.setDate(now.getDate() - 30)).toISOString();
        } else if (dateRange === '90d') {
          dateFilter = new Date(now.setDate(now.getDate() - 90)).toISOString();
        }

        // Load counts
        const [usersResult, catsResult] = await Promise.all([
          supabase.from('profiles').select('*', { count: 'exact', head: true }),
          supabase.from('cats').select('*', { count: 'exact', head: true }),
        ]);

        setTotalUsers(usersResult.count || 0);
        setTotalCats(catsResult.count || 0);

        // Load analytics events
        let analyticsQuery = supabase
          .from('analytics_events')
          .select('*')
          .order('created_at', { ascending: false });

        if (dateFilter) {
          analyticsQuery = analyticsQuery.gte('created_at', dateFilter);
        }

        const { data: analyticsData, error: analyticsError } = await analyticsQuery;

        if (analyticsError) {
          console.error('Analytics error:', analyticsError);
          // Continue with partial data
        }

        const events = analyticsData || [];

        // Count event types
        const recommendationViews = events.filter(
          (e) => e.event_type === 'recommendation_view'
        ).length;
        const foodClicks = events.filter(
          (e) => e.event_type === 'recommendation_click' || e.event_type === 'food_detail_view'
        ).length;

        setTotalRecommendationViews(recommendationViews);
        setTotalFoodClicks(foodClicks);

        // Recent activity (last 10 events)
        setRecentActivity(events.slice(0, 10));

        // Calculate popular foods
        const foodInteractions = new Map<string, { views: number; clicks: number }>();

        events.forEach((event) => {
          if (event.food_id) {
            const current = foodInteractions.get(event.food_id) || { views: 0, clicks: 0 };
            if (event.event_type === 'recommendation_view') {
              current.views++;
            } else if (
              event.event_type === 'recommendation_click' ||
              event.event_type === 'food_detail_view'
            ) {
              current.clicks++;
            }
            foodInteractions.set(event.food_id, current);
          }
        });

        // Get feedback counts per food
        const { data: feedbackCounts } = await supabase
          .from('recommendation_feedback')
          .select('food_id');

        const feedbackByFood = new Map<string, number>();
        feedbackCounts?.forEach((f) => {
          feedbackByFood.set(f.food_id, (feedbackByFood.get(f.food_id) || 0) + 1);
        });

        // Get food details for popular foods
        const foodIds = [...foodInteractions.keys()];
        if (foodIds.length > 0) {
          const { data: foodsData } = await supabase
            .from('cat_foods')
            .select('*')
            .in('id', foodIds);

          const popularFoodStats: FoodStats[] = (foodsData || [])
            .map((food) => ({
              food,
              views: foodInteractions.get(food.id)?.views || 0,
              clicks: foodInteractions.get(food.id)?.clicks || 0,
              feedbackCount: feedbackByFood.get(food.id) || 0,
            }))
            .sort((a, b) => b.clicks + b.views - (a.clicks + a.views))
            .slice(0, 10);

          setPopularFoods(popularFoodStats);
        }
      } catch (err: unknown) {
        console.error('Error loading analytics:', err);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router, supabase, dateRange]);

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

  const formatEventType = (type: string) => {
    return type
      .split('_')
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminLayout>
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Analytics</h1>
                <p className="text-gray-600 mt-1">Track user engagement and popular foods</p>
              </div>
              <div className="w-40">
                <Select
                  label="Date Range"
                  value={dateRange}
                  onChange={(e) => setDateRange(e.target.value as DateRange)}
                  options={[
                    { value: '7d', label: 'Last 7 days' },
                    { value: '30d', label: 'Last 30 days' },
                    { value: '90d', label: 'Last 90 days' },
                    { value: 'all', label: 'All time' },
                  ]}
                />
              </div>
            </div>

            {error && (
              <Card variant="bordered" className="text-center py-8 mb-6">
                <p className="text-red-600">{error}</p>
              </Card>
            )}

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard title="Total Users" value={totalUsers} icon="👤" />
              <StatCard title="Cat Profiles" value={totalCats} icon="🐱" />
              <StatCard
                title="Recommendation Views"
                value={totalRecommendationViews}
                icon="👀"
              />
              <StatCard title="Food Clicks" value={totalFoodClicks} icon="🖱️" />
            </div>

            <div className="grid lg:grid-cols-2 gap-6">
              {/* Popular Foods */}
              <Card variant="bordered">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Popular Foods
                </h2>

                {popularFoods.length > 0 ? (
                  <div className="space-y-3">
                    {popularFoods.map((item, index) => (
                      <div
                        key={item.food.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-lg font-bold text-gray-400 w-6">
                          {index + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900 truncate">
                            {item.food.brand} {item.food.product_name}
                          </p>
                          <div className="flex gap-4 text-sm text-gray-500">
                            <span>{item.views} views</span>
                            <span>{item.clicks} clicks</span>
                            <span>{item.feedbackCount} feedback</span>
                          </div>
                        </div>
                        <span
                          className={`px-2 py-0.5 rounded text-xs font-medium ${
                            item.food.food_type === 'dry'
                              ? 'bg-amber-100 text-amber-700'
                              : 'bg-blue-100 text-blue-700'
                          }`}
                        >
                          {item.food.food_type}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    No food interaction data available
                  </p>
                )}
              </Card>

              {/* Recent Activity */}
              <Card variant="bordered">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Recent Activity
                </h2>

                {recentActivity.length > 0 ? (
                  <div className="space-y-3">
                    {recentActivity.map((event) => (
                      <div
                        key={event.id}
                        className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <span className="text-lg">
                          {event.event_type === 'recommendation_view'
                            ? '👀'
                            : event.event_type === 'recommendation_click'
                            ? '🖱️'
                            : event.event_type === 'food_detail_view'
                            ? '🔍'
                            : event.event_type === 'feedback_submitted'
                            ? '💬'
                            : '📊'}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-gray-900">
                            {formatEventType(event.event_type)}
                          </p>
                          <p className="text-sm text-gray-500">
                            {new Date(event.created_at).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">No recent activity</p>
                )}
              </Card>
            </div>
          </div>
        </AdminLayout>
      </div>
    </div>
  );
}
