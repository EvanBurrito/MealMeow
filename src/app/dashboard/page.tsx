import Link from 'next/link';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Cat } from '@/types';
import Header from '@/components/layout/Header';
import CatCard from '@/components/cats/CatCard';
import Button from '@/components/ui/Button';
import Card from '@/components/ui/Card';

export const dynamic = 'force-dynamic';

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  // Check if user is admin
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  const isAdmin = profile?.is_admin || false;

  const { data, error } = await supabase
    .from('cats')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const cats = (data || []) as Cat[];

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin={isAdmin} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Cats</h1>
            <p className="text-gray-600 mt-1">
              Manage your cat profiles and get personalized food recommendations
            </p>
          </div>
          <Link href="/cats/new">
            <Button size="lg">+ Add Cat</Button>
          </Link>
        </div>

        {error && (
          <Card hover={false} className="bg-red-50 border border-red-200 mb-6">
            <p className="text-red-600">Error loading cats: {error.message}</p>
          </Card>
        )}

        {cats.length === 0 && (
          <Card variant="bordered" hover={false} className="text-center py-12 animate-fade-in-up">
            <div className="text-6xl mb-4">🐱</div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">
              No cats yet!
            </h2>
            <p className="text-gray-600 mb-6">
              Add your first cat to get personalized food recommendations.
            </p>
            <Link href="/cats/new">
              <Button>Add Your First Cat</Button>
            </Link>
          </Card>
        )}

        {cats.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 animate-fade-in">
            {cats.map((cat) => (
              <CatCard key={cat.id} cat={cat} />
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
