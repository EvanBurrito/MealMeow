import { redirect } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { CatFood } from '@/types';
import Header from '@/components/layout/Header';
import FoodDatabaseList from '@/components/foods/FoodDatabaseList';
import Button from '@/components/ui/Button';

export default async function DatabasePage() {
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

  const { data: foods } = await supabase
    .from('cat_foods')
    .select('*')
    .order('brand', { ascending: true });

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin={isAdmin} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Food Database</h1>
            <p className="text-gray-600 mt-1">
              Browse all cat foods in our database
              <span className="mx-2 text-gray-300">·</span>
              <Link href="/foods/my-submissions" className="text-gray-400 hover:text-orange-500 transition-colors">
                My submissions
              </Link>
            </p>
          </div>
          <Link href="/foods/submit">
            <Button size="lg">Submit Food</Button>
          </Link>
        </div>

        <FoodDatabaseList foods={(foods as CatFood[]) || []} />
      </main>
    </div>
  );
}
