'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { CatFood } from '@/types';
import Header from '@/components/layout/Header';
import StandaloneMealBuilder from '@/components/saved-plans/StandaloneMealBuilder';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';

function NewSavedPlanContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  // Get plan parameters from URL
  const planName = searchParams.get('name') || 'Untitled Plan';
  const targetDer = parseInt(searchParams.get('der') || '0');
  const mealsPerDay = parseInt(searchParams.get('meals') || '2');
  const derivedFromWeight = searchParams.get('weight') ? parseFloat(searchParams.get('weight')!) : undefined;
  const derivedFromAge = searchParams.get('age') ? parseInt(searchParams.get('age')!) : undefined;

  const [foods, setFoods] = useState<CatFood[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [foodTypeFilter, setFoodTypeFilter] = useState<'all' | 'wet' | 'dry'>('all');
  const [budgetFilter, setBudgetFilter] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        // Check auth
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          router.push('/auth/login');
          return;
        }

        // Validate required params
        if (!targetDer || targetDer < 50) {
          setError('Invalid calorie target. Please create a plan from the dashboard.');
          return;
        }

        // Load foods
        const { data: foodData, error: foodError } = await supabase
          .from('cat_foods')
          .select('*')
          .eq('is_complete_balanced', true);

        if (foodError) {
          console.error('Error loading foods:', foodError);
          setError('Failed to load foods');
          return;
        }

        setFoods(foodData || []);
      } catch (err) {
        console.error('Error:', err);
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [router, supabase, targetDer]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">📋</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Card variant="bordered" className="text-center py-12">
            <p className="text-red-600 mb-4">{error}</p>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn />

      <main className="max-w-6xl mx-auto px-4 py-8 pb-24 lg:pb-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-blue-500">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">New Saved Plan</span>
        </div>

        <div className="space-y-6 animate-fade-in">
          {/* Plan Info Header */}
          <div className="bg-gradient-to-r from-blue-500 to-indigo-600 rounded-2xl p-6 text-white">
            <h1 className="text-2xl font-bold mb-2">{planName}</h1>
            <div className="flex flex-wrap gap-4 text-blue-100">
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
                </svg>
                {targetDer} kcal/day target
              </span>
              <span className="flex items-center gap-1">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {mealsPerDay} meals/day
              </span>
              {derivedFromWeight && derivedFromAge && (
                <span className="flex items-center gap-1">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                  Calculated from {derivedFromWeight} lbs, {derivedFromAge} months
                </span>
              )}
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 items-end">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Food Type
              </label>
              <div className="flex rounded-lg overflow-hidden border border-gray-300">
                {(['all', 'dry', 'wet'] as const).map((type, idx) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => setFoodTypeFilter(type)}
                    className={`px-4 py-2 text-sm font-medium transition-colors ${
                      foodTypeFilter === type
                        ? 'bg-blue-500 text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-50'
                    } ${idx > 0 ? 'border-l border-gray-300' : ''}`}
                  >
                    {type === 'all' ? 'All' : type === 'dry' ? 'Dry' : 'Wet'}
                  </button>
                ))}
              </div>
            </div>
            <div className="w-48">
              <Input
                type="number"
                label="Max Budget ($/month)"
                value={budgetFilter}
                onChange={(e) => setBudgetFilter(e.target.value)}
                placeholder="No limit"
                min="0"
                step="10"
              />
            </div>
          </div>

          {/* Food Builder */}
          {foods.length === 0 ? (
            <Card variant="bordered" className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Foods Available
              </h3>
              <p className="text-gray-600">
                Add foods to the database to start building meal plans.
              </p>
            </Card>
          ) : (
            <StandaloneMealBuilder
              planName={planName}
              targetDer={targetDer}
              mealsPerDay={mealsPerDay}
              foods={foods}
              foodTypeFilter={foodTypeFilter}
              budgetFilter={budgetFilter}
              derivedFromWeight={derivedFromWeight}
              derivedFromAge={derivedFromAge}
            />
          )}
        </div>
      </main>
    </div>
  );
}

export default function NewSavedPlanPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">📋</div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </main>
      </div>
    }>
      <NewSavedPlanContent />
    </Suspense>
  );
}
