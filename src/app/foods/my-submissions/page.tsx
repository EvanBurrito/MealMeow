'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { UserSubmittedFood } from '@/types';
import Header from '@/components/layout/Header';
import SubmissionCard from '@/components/foods/SubmissionCard';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export default function MySubmissionsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [submissions, setSubmissions] = useState<UserSubmittedFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadSubmissions() {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          router.push('/auth/login');
          return;
        }

        const { data, error } = await supabase
          .from('user_submitted_foods')
          .select('*')
          .eq('submitted_by', user.id)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setSubmissions(data || []);
      } catch (err: unknown) {
        console.error('Error loading submissions:', err);
        setError('Failed to load submissions');
      } finally {
        setIsLoading(false);
      }
    }

    loadSubmissions();
  }, [router, supabase]);

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this submission?')) {
      return;
    }

    try {
      const { error } = await supabase.from('user_submitted_foods').delete().eq('id', id);
      if (error) throw error;

      setSubmissions((prev) => prev.filter((s) => s.id !== id));
    } catch (err) {
      console.error('Error deleting submission:', err);
      alert('Failed to delete submission');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">🐱</div>
            <p className="text-gray-600">Loading submissions...</p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn />

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-orange-500">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">My Submissions</span>
        </div>

        <div className="flex items-center justify-between mb-8 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Food Submissions</h1>
            <p className="text-gray-600 mt-1">
              Track the status of your submitted food products
            </p>
          </div>
          <Link href="/foods/submit">
            <Button size="lg">+ Submit Food</Button>
          </Link>
        </div>

        {error && (
          <Card variant="bordered" className="text-center py-8 mb-6">
            <p className="text-red-600">{error}</p>
          </Card>
        )}

        {submissions.length === 0 && !error && (
          <Card variant="bordered" className="text-center py-12 animate-fade-in">
            <div className="text-6xl mb-4">📦</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No Submissions Yet</h3>
            <p className="text-gray-600 mb-6">
              Help expand our food database by submitting cat food products you know about.
            </p>
            <Link href="/foods/submit">
              <Button>Submit Your First Food</Button>
            </Link>
          </Card>
        )}

        {submissions.length > 0 && (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {submissions.map((submission, index) => (
              <div
                key={submission.id}
                className="animate-fade-in-up"
                style={{ animationDelay: `${index * 0.05}s` }}
              >
                <SubmissionCard submission={submission} onDelete={handleDelete} />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
