import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import AdminLayout from '@/components/admin/AdminLayout';
import StatCard from '@/components/admin/StatCard';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('is_admin, email')
    .eq('id', user.id)
    .single();

  // Debug: Log what we're getting
  console.log('Admin check:', {
    userId: user.id,
    userEmail: user.email,
    profile,
    profileError,
    isAdmin: profile?.is_admin
  });

  if (!profile?.is_admin) {
    redirect('/dashboard');
  }

  // Fetch stats
  const [
    { count: pendingSubmissions },
    { count: totalFeedback },
    { count: totalUsers },
    { count: totalCats },
    { count: totalFoods },
  ] = await Promise.all([
    supabase
      .from('user_submitted_foods')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending'),
    supabase
      .from('recommendation_feedback')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('cats')
      .select('*', { count: 'exact', head: true }),
    supabase
      .from('cat_foods')
      .select('*', { count: 'exact', head: true }),
  ]);

  // Recent feedback
  const { data: recentFeedback } = await supabase
    .from('recommendation_feedback')
    .select(`
      id,
      rating,
      feedback_type,
      comment,
      created_at,
      food_id
    `)
    .order('created_at', { ascending: false })
    .limit(5);

  // Get food names for recent feedback
  const foodIds = recentFeedback?.map((f) => f.food_id).filter(Boolean) || [];
  const { data: foods } = await supabase
    .from('cat_foods')
    .select('id, brand, product_name')
    .in('id', foodIds);

  const foodMap = new Map(foods?.map((f) => [f.id, f]) || []);

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminLayout>
          <div className="animate-fade-in">
            <div className="mb-8">
              <h1 className="text-3xl font-bold text-gray-900">Admin Dashboard</h1>
              <p className="text-gray-600 mt-1">
                Manage submissions, review feedback, and view analytics
              </p>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
              <StatCard
                title="Pending Submissions"
                value={pendingSubmissions || 0}
                icon="📝"
                description="Awaiting review"
              />
              <StatCard
                title="Total Feedback"
                value={totalFeedback || 0}
                icon="💬"
              />
              <StatCard
                title="Total Users"
                value={totalUsers || 0}
                icon="👤"
              />
              <StatCard
                title="Cat Profiles"
                value={totalCats || 0}
                icon="🐱"
              />
            </div>

            {/* Quick Links */}
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              <Link href="/admin/submissions">
                <Card variant="bordered" className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">📝</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Review Submissions</h3>
                      <p className="text-sm text-gray-500">
                        {pendingSubmissions || 0} pending
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/admin/feedback">
                <Card variant="bordered" className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">💬</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">View Feedback</h3>
                      <p className="text-sm text-gray-500">
                        {totalFeedback || 0} total responses
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>

              <Link href="/admin/analytics">
                <Card variant="bordered" className="hover:border-orange-300 hover:shadow-md transition-all cursor-pointer">
                  <div className="flex items-center gap-4">
                    <div className="text-4xl">📈</div>
                    <div>
                      <h3 className="font-semibold text-gray-900">Analytics</h3>
                      <p className="text-sm text-gray-500">
                        {totalFoods || 0} foods in database
                      </p>
                    </div>
                  </div>
                </Card>
              </Link>
            </div>

            {/* Recent Feedback */}
            <Card variant="bordered">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">Recent Feedback</h2>
                <Link href="/admin/feedback" className="text-sm text-orange-600 hover:text-orange-700">
                  View all
                </Link>
              </div>

              {recentFeedback && recentFeedback.length > 0 ? (
                <div className="space-y-3">
                  {recentFeedback.map((feedback) => {
                    const food = foodMap.get(feedback.food_id);
                    return (
                      <div
                        key={feedback.id}
                        className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                      >
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900">
                              {food ? `${food.brand} ${food.product_name}` : 'Unknown food'}
                            </span>
                            {feedback.rating && (
                              <span className="text-yellow-500">
                                {'★'.repeat(feedback.rating)}
                                {'☆'.repeat(5 - feedback.rating)}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 capitalize">
                            {feedback.feedback_type.replace('_', ' ')}
                          </p>
                          {feedback.comment && (
                            <p className="text-sm text-gray-600 mt-1 truncate">
                              {feedback.comment}
                            </p>
                          )}
                        </div>
                        <span className="text-xs text-gray-400 whitespace-nowrap">
                          {new Date(feedback.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-gray-500 text-center py-4">No feedback yet</p>
              )}
            </Card>
          </div>
        </AdminLayout>
      </div>
    </div>
  );
}
