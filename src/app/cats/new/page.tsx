import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import CatForm from '@/components/cats/CatForm';

export const dynamic = 'force-dynamic';

export default async function NewCatPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <CatForm mode="create" />
      </main>
    </div>
  );
}
