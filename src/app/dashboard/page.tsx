import Link from 'next/link';
import Image from 'next/image';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { Cat, CatFood, CatWithFoodPlan, SavedMealPlan, SavedMealPlanWithFoods } from '@/types';
import Header from '@/components/layout/Header';
import CatCard from '@/components/cats/CatCard';
import GettingStartedSection from '@/components/dashboard/GettingStartedSection';
import FoodPlanCard from '@/components/dashboard/FoodPlanCard';
import FeedingTipsSection from '@/components/dashboard/FeedingTipsSection';
import SavedPlansSection from '@/components/dashboard/SavedPlansSection';
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

  // Load cats with their selected food
  const { data: catsData, error } = await supabase
    .from('cats')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  const cats = (catsData || []) as Cat[];

  // Get all unique food IDs (both primary and secondary)
  const allFoodIds = cats
    .flatMap((cat) => [cat.selected_food_id, cat.secondary_food_id])
    .filter((id): id is string => id !== null);
  const uniqueFoodIds = [...new Set(allFoodIds)];

  // Load all referenced foods
  let foodsMap: Map<string, CatFood> = new Map();
  if (uniqueFoodIds.length > 0) {
    const { data: foodsData } = await supabase
      .from('cat_foods')
      .select('*')
      .in('id', uniqueFoodIds);

    if (foodsData) {
      foodsData.forEach((food: CatFood) => {
        foodsMap.set(food.id, food);
      });
    }
  }

  // Create cats with food plan data (including secondary food)
  const catsWithPlans: CatWithFoodPlan[] = cats.map((cat) => ({
    ...cat,
    selected_food: cat.selected_food_id ? foodsMap.get(cat.selected_food_id) : null,
    secondary_food: cat.secondary_food_id ? foodsMap.get(cat.secondary_food_id) : null,
  }));

  // Check if any cat has a food plan
  const hasFoodPlan = catsWithPlans.some((cat) => cat.selected_food);
  const catsWithFoodPlans = catsWithPlans.filter((cat) => cat.selected_food);
  const catsWithoutFoodPlans = catsWithPlans.filter((cat) => !cat.selected_food);

  // Load saved meal plans
  const { data: savedPlansData } = await supabase
    .from('saved_meal_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  const savedPlans = (savedPlansData || []) as SavedMealPlan[];

  // Get food IDs from saved plans
  const savedPlanFoodIds = savedPlans.flatMap((plan) =>
    plan.food_selections.map((s) => s.foodId)
  );
  const uniqueSavedPlanFoodIds = [...new Set(savedPlanFoodIds)];

  // Load foods for saved plans (merge with existing foodsMap)
  if (uniqueSavedPlanFoodIds.length > 0) {
    const newFoodIds = uniqueSavedPlanFoodIds.filter((id) => !foodsMap.has(id));
    if (newFoodIds.length > 0) {
      const { data: additionalFoods } = await supabase
        .from('cat_foods')
        .select('*')
        .in('id', newFoodIds);

      if (additionalFoods) {
        additionalFoods.forEach((food: CatFood) => {
          foodsMap.set(food.id, food);
        });
      }
    }
  }

  // Create saved plans with food data
  const savedPlansWithFoods: SavedMealPlanWithFoods[] = savedPlans.map((plan) => ({
    ...plan,
    foods: plan.food_selections
      .map((s) => foodsMap.get(s.foodId))
      .filter((f): f is CatFood => f !== undefined),
  }));

  return (
    <div className="min-h-screen bg-gray-50">
      <Header isLoggedIn isAdmin={isAdmin} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Getting Started Section - Show when no cats or no food plans */}
        {(cats.length === 0 || !hasFoodPlan) && (
          <GettingStartedSection hasCats={cats.length > 0} hasFoodPlan={hasFoodPlan} />
        )}

        {/* Active Food Plans Section */}
        {catsWithFoodPlans.length > 0 && (
          <div className="mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">Active Food Plans</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {catsWithFoodPlans.map((cat) => (
                <div key={cat.id}>
                  <div className="flex items-center gap-2 mb-2">
                    <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-orange-200 bg-orange-50 flex-shrink-0">
                      {cat.profile_image_url ? (
                        <Image
                          src={cat.profile_image_url}
                          alt={cat.name}
                          fill
                          className="object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-sm">
                          🐱
                        </div>
                      )}
                    </div>
                    <h3 className="font-semibold text-gray-900">{cat.name}</h3>
                  </div>
                  <FoodPlanCard cat={cat} food={cat.selected_food!} secondaryFood={cat.secondary_food} />
                </div>
              ))}
            </div>

            {/* Show tips for the first cat with a food plan */}
            {catsWithFoodPlans[0] && catsWithFoodPlans[0].selected_food && (
              <FeedingTipsSection
                cat={catsWithFoodPlans[0]}
                food={catsWithFoodPlans[0].selected_food}
              />
            )}
          </div>
        )}

        {/* Saved Plans Section */}
        <SavedPlansSection plans={savedPlansWithFoods} />

        {/* My Cats Section */}
        <div className="animate-fade-in">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">My Cats</h2>
              <p className="text-gray-600 text-sm mt-1">
                {cats.length === 0
                  ? 'Add your first cat to get started'
                  : `${cats.length} cat${cats.length !== 1 ? 's' : ''} · ${catsWithFoodPlans.length} with food plan${catsWithFoodPlans.length !== 1 ? 's' : ''}`}
              </p>
            </div>
            <Link href="/cats/new">
              <Button>+ Add Cat</Button>
            </Link>
          </div>

          {error && (
            <Card hover={false} className="bg-red-50 border border-red-200 mb-6">
              <p className="text-red-600">Error loading cats: {error.message}</p>
            </Card>
          )}

          {cats.length === 0 && (
            <Card variant="bordered" hover={false} className="text-center py-12">
              <div className="text-6xl mb-4">🐱</div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                No cats yet!
              </h3>
              <p className="text-gray-600 mb-6">
                Add your first cat to get personalized food recommendations.
              </p>
              <Link href="/cats/new">
                <Button>Add Your First Cat</Button>
              </Link>
            </Card>
          )}

          {cats.length > 0 && (
            <>
              {/* Cats without food plans first if there are any */}
              {catsWithoutFoodPlans.length > 0 && hasFoodPlan && (
                <div className="mb-6">
                  <p className="text-sm text-gray-500 mb-3">
                    Need a food plan:
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catsWithoutFoodPlans.map((cat) => (
                      <CatCard key={cat.id} cat={cat} />
                    ))}
                  </div>
                </div>
              )}

              {/* All cats if no one has a food plan, or cats with plans */}
              {!hasFoodPlan && (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {cats.map((cat) => (
                    <CatCard key={cat.id} cat={cat} />
                  ))}
                </div>
              )}

              {hasFoodPlan && catsWithFoodPlans.length > 0 && (
                <div className="mt-6">
                  <p className="text-sm text-gray-500 mb-3">
                    With active food plans:
                  </p>
                  <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {catsWithFoodPlans.map((cat) => (
                      <CatCard key={cat.id} cat={cat} />
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
