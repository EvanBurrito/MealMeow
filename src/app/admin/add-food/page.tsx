import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import Header from '@/components/layout/Header';
import AdminLayout from '@/components/admin/AdminLayout';
import AdminFoodForm from '@/components/admin/AdminFoodForm';

export default async function AdminAddFoodPage() {
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

  if (!profile?.is_admin) {
    redirect('/dashboard');
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin />

      <div className="max-w-6xl mx-auto px-4 py-8">
        <AdminLayout>
          <div className="animate-fade-in">
            <AdminFoodForm mode="add" />
          </div>
        </AdminLayout>
      </div>
    </div>
  );
}
