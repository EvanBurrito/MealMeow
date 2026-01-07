'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Cat, CatFood, FoodRecommendation, NutritionPlan } from '@/types';
import { calculateNutritionPlan, generateRecommendations } from '@/lib/nutrition';
import Header from '@/components/layout/Header';
import NutritionSummary from '@/components/recommendations/NutritionSummary';
import RecommendationCard from '@/components/recommendations/RecommendationCard';
import RecommendationFilters from '@/components/recommendations/RecommendationFilters';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';

interface RecommendationsPageProps {
  params: Promise<{ id: string }>;
}

export default function RecommendationsPage({ params }: RecommendationsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const supabase = createClient();

  const [cat, setCat] = useState<Cat | null>(null);
  const [foods, setFoods] = useState<CatFood[]>([]);
  const [nutritionPlan, setNutritionPlan] = useState<NutritionPlan | null>(null);
  const [recommendations, setRecommendations] = useState<FoodRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // Filters
  const [foodType, setFoodType] = useState('any');
  const [budget, setBudget] = useState('');

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

        // Load cat
        const { data: catData, error: catError } = await supabase
          .from('cats')
          .select('*')
          .eq('id', id)
          .eq('user_id', user.id)
          .single();

        if (catError || !catData) {
          setError('Cat not found');
          return;
        }

        setCat(catData);
        const plan = calculateNutritionPlan(catData);
        setNutritionPlan(plan);

        // Load foods
        const { data: foodData, error: foodError } = await supabase
          .from('cat_foods')
          .select('*')
          .eq('is_complete_balanced', true);

        if (foodError) {
          console.error('Error loading foods:', foodError);
        }

        setFoods(foodData || []);
      } catch {
        setError('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    }

    loadData();
  }, [id, router, supabase]);

  useEffect(() => {
    if (cat && foods.length > 0) {
      const recs = generateRecommendations(cat, foods, {
        foodTypePreference: foodType as 'dry' | 'wet' | 'any',
        maxMonthlyBudget: budget ? parseFloat(budget) : undefined,
      });
      setRecommendations(recs);
    } else {
      setRecommendations([]);
    }
  }, [cat, foods, foodType, budget]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <div className="text-center py-12">
            <div className="animate-spin text-4xl mb-4">🐱</div>
            <p className="text-gray-600">Loading recommendations...</p>
          </div>
        </main>
      </div>
    );
  }

  if (error || !cat || !nutritionPlan) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Header isLoggedIn />
        <main className="max-w-6xl mx-auto px-4 py-8">
          <Card variant="bordered" className="text-center py-12">
            <p className="text-red-600 mb-4">{error || 'Cat not found'}</p>
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

      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 text-gray-600 mb-6">
          <Link href="/dashboard" className="hover:text-orange-500">
            Dashboard
          </Link>
          <span>/</span>
          <Link href={`/cats/${cat.id}`} className="hover:text-orange-500">
            {cat.name}
          </Link>
          <span>/</span>
          <span className="text-gray-900">Recommendations</span>
        </div>

        <div className="space-y-6">
          <NutritionSummary cat={cat} nutritionPlan={nutritionPlan} />

          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-900">
              Food Recommendations
            </h2>
            <RecommendationFilters
              foodType={foodType}
              budget={budget}
              onFoodTypeChange={setFoodType}
              onBudgetChange={setBudget}
            />
          </div>

          {foods.length === 0 && (
            <Card variant="bordered" className="text-center py-12">
              <div className="text-6xl mb-4">📦</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Foods in Database
              </h3>
              <p className="text-gray-600 mb-4">
                The food database is empty. Add some cat food products to get
                personalized recommendations.
              </p>
              <p className="text-sm text-gray-500">
                You can add foods directly through Supabase or build an admin
                interface.
              </p>
            </Card>
          )}

          {foods.length > 0 && recommendations.length === 0 && (
            <Card variant="bordered" className="text-center py-12">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No Matching Foods
              </h3>
              <p className="text-gray-600">
                No foods match your current filters. Try adjusting your preferences
                or budget.
              </p>
            </Card>
          )}

          {recommendations.length > 0 && (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendations.slice(0, 9).map((rec, index) => (
                <RecommendationCard
                  key={rec.food.id}
                  recommendation={rec}
                  nutritionPlan={nutritionPlan}
                  rank={index + 1}
                />
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
