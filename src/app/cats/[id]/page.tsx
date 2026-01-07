import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Cat } from '@/types';
import { formatAge, calculateNutritionPlan } from '@/lib/nutrition';
import Header from '@/components/layout/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

export const dynamic = 'force-dynamic';

interface CatPageProps {
  params: Promise<{ id: string }>;
}

export default async function CatPage({ params }: CatPageProps) {
  const { id } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

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
  const nutritionPlan = calculateNutritionPlan(cat);
  const genderEmoji = cat.gender === 'male' ? '♂️' : '♀️';

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-orange-500">
            Dashboard
          </Link>
          <span>/</span>
          <span className="text-gray-900">{cat.name}</span>
        </div>

        <Card variant="elevated">
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-4">
              <div className="text-6xl">🐱</div>
              <div>
                <h1 className="text-3xl font-bold text-gray-900">{cat.name}</h1>
                <p className="text-gray-600">{cat.breed}</p>
              </div>
            </div>
            <Link href={`/cats/${cat.id}/edit`}>
              <Button variant="outline">Edit Profile</Button>
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Profile Details
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Age</dt>
                  <dd className="font-medium">{formatAge(cat.age_months)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Weight</dt>
                  <dd className="font-medium">{cat.weight_lbs} lbs</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Gender</dt>
                  <dd className="font-medium">
                    {genderEmoji} {cat.gender}{' '}
                    {cat.is_neutered ? '(Fixed)' : '(Intact)'}
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Activity Level</dt>
                  <dd className="font-medium capitalize">{cat.activity_level}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Weight Goal</dt>
                  <dd className="font-medium capitalize">{cat.goal}</dd>
                </div>
              </dl>
            </div>

            <div>
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Nutrition Summary
              </h2>
              <dl className="space-y-3">
                <div className="flex justify-between">
                  <dt className="text-gray-500">Daily Calories (DER)</dt>
                  <dd className="font-medium text-orange-600">
                    {nutritionPlan.der} kcal/day
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Resting Energy (RER)</dt>
                  <dd className="font-medium">{nutritionPlan.rer} kcal</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Life Stage Factor</dt>
                  <dd className="font-medium">
                    {nutritionPlan.factor}x ({nutritionPlan.factorName})
                  </dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Recommended Meals/Day</dt>
                  <dd className="font-medium">{nutritionPlan.mealsPerDay}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-gray-500">Treat Budget</dt>
                  <dd className="font-medium">{nutritionPlan.treatBudget} kcal</dd>
                </div>
              </dl>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-gray-200">
            <Link href={`/cats/${cat.id}/recommendations`}>
              <Button size="lg" className="w-full">
                Get Food Recommendations
              </Button>
            </Link>
          </div>
        </Card>
      </main>
    </div>
  );
}
