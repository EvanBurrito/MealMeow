import { redirect, notFound } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Cat } from '@/types';
import Header from '@/components/layout/Header';
import CatForm from '@/components/cats/CatForm';

export const dynamic = 'force-dynamic';

interface EditCatPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditCatPage({ params }: EditCatPageProps) {
  const { id } = await params;
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
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !data) {
    notFound();
  }

  const cat = data as Cat;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin={isAdmin} />

      <main className="max-w-6xl mx-auto px-4 py-8 animate-fade-in">
        <CatForm cat={cat} mode="edit" />
      </main>
    </div>
  );
}
