'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  MealPlanCategory,
  SharedMealPlanWithFoods,
  CatFood,
  PublicCat,
} from '@/types';
import CategoryFilter from '@/components/community/CategoryFilter';
import SharedPlanCard from '@/components/community/SharedPlanCard';
import UsePlanModal from '@/components/community/UsePlanModal';
import Card from '@/components/ui/Card';

type SortOption = 'recent' | 'popular' | 'most_used';

export default function CommunityPlansPage() {
  const [plans, setPlans] = useState<SharedMealPlanWithFoods[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<MealPlanCategory | 'all'>('all');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [selectedPlan, setSelectedPlan] = useState<SharedMealPlanWithFoods | null>(null);
  const supabase = createClient();

  const fetchPlans = useCallback(async () => {
    setIsLoading(true);

    try {
      // Build query for shared plans
      let query = supabase
        .from('saved_meal_plans')
        .select('*')
        .eq('is_shared', true);

      // Filter by category
      if (selectedCategory !== 'all') {
        query = query.eq('category', selectedCategory);
      }

      // Sort
      switch (sortBy) {
        case 'popular':
          query = query.order('likes_count', { ascending: false });
          break;
        case 'most_used':
          query = query.order('uses_count', { ascending: false });
          break;
        case 'recent':
        default:
          query = query.order('shared_at', { ascending: false });
      }

      const { data: plansData, error: plansError } = await query;

      if (plansError) throw plansError;

      if (!plansData || plansData.length === 0) {
        setPlans([]);
        setIsLoading(false);
        return;
      }

      // Get all cat IDs from plans
      const catIds = [...new Set(plansData.map((p) => p.cat_id).filter(Boolean))];

      // Get all food IDs from plans
      const allFoodIds = plansData.flatMap((plan) =>
        (plan.food_selections as { foodId: string }[]).map((s) => s.foodId)
      );
      const uniqueFoodIds = [...new Set(allFoodIds)];

      // Fetch cats
      const catsMap = new Map<string, PublicCat>();
      if (catIds.length > 0) {
        const { data: catsData } = await supabase
          .from('cats')
          .select('*')
          .in('id', catIds)
          .eq('is_public', true);

        if (catsData) {
          catsData.forEach((cat) => {
            catsMap.set(cat.id, cat as PublicCat);
          });
        }
      }

      // Fetch foods
      const foodsMap = new Map<string, CatFood>();
      if (uniqueFoodIds.length > 0) {
        const { data: foodsData } = await supabase
          .from('cat_foods')
          .select('*')
          .in('id', uniqueFoodIds);

        if (foodsData) {
          foodsData.forEach((food) => {
            foodsMap.set(food.id, food);
          });
        }
      }

      // Get current user for like/save status
      const {
        data: { user },
      } = await supabase.auth.getUser();

      // Fetch user's likes and saves
      const userLikes = new Set<string>();
      const userSaves = new Set<string>();

      if (user) {
        const planIds = plansData.map((p) => p.id);

        const [likesResult, savesResult] = await Promise.all([
          supabase
            .from('plan_likes')
            .select('plan_id')
            .eq('user_id', user.id)
            .in('plan_id', planIds),
          supabase
            .from('plan_saves')
            .select('plan_id')
            .eq('user_id', user.id)
            .in('plan_id', planIds),
        ]);

        if (likesResult.data) {
          likesResult.data.forEach((l) => userLikes.add(l.plan_id));
        }
        if (savesResult.data) {
          savesResult.data.forEach((s) => userSaves.add(s.plan_id));
        }
      }

      // Combine data
      const plansWithFoods: SharedMealPlanWithFoods[] = plansData.map((plan) => ({
        ...plan,
        food_selections: plan.food_selections as { foodId: string; mealCount: number }[],
        health_focus: (plan.health_focus || []) as string[],
        cat: plan.cat_id ? catsMap.get(plan.cat_id) : undefined,
        foods: (plan.food_selections as { foodId: string }[])
          .map((s) => foodsMap.get(s.foodId))
          .filter((f): f is CatFood => f !== undefined),
        isLiked: userLikes.has(plan.id),
        isSaved: userSaves.has(plan.id),
      }));

      setPlans(plansWithFoods);
    } catch (err) {
      console.error('Error fetching plans:', err);
    } finally {
      setIsLoading(false);
    }
  }, [selectedCategory, sortBy, supabase]);

  useEffect(() => {
    fetchPlans();
  }, [fetchPlans]);

  return (
    <div>
      {/* Filters */}
      <div className="mb-6">
        <CategoryFilter
          selected={selectedCategory}
          onChange={setSelectedCategory}
        />
      </div>

      {/* Sort Options */}
      <div className="flex items-center justify-between mb-6">
        <p className="text-gray-600">
          {isLoading ? 'Loading...' : `${plans.length} meal plan${plans.length !== 1 ? 's' : ''}`}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">Sort by:</span>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="text-sm border border-gray-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            <option value="recent">Most Recent</option>
            <option value="popular">Most Liked</option>
            <option value="most_used">Most Used</option>
          </select>
        </div>
      </div>

      {/* Plans Grid */}
      {isLoading ? (
        <div className="grid md:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} variant="bordered" className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-1/3 mb-4" />
              <div className="h-20 bg-gray-200 rounded mb-4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </Card>
          ))}
        </div>
      ) : plans.length === 0 ? (
        <Card variant="bordered" hover={false} className="text-center py-12">
          <div className="text-5xl mb-4">🍽️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">
            No shared plans yet
          </h3>
          <p className="text-gray-600 mb-4">
            {selectedCategory === 'all'
              ? 'Be the first to share a meal plan with the community!'
              : `No plans in the ${selectedCategory.replace('_', ' ')} category yet.`}
          </p>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {plans.map((plan) => (
            <SharedPlanCard
              key={plan.id}
              plan={plan}
              onUsePlan={() => setSelectedPlan(plan)}
            />
          ))}
        </div>
      )}

      {/* Use Plan Modal */}
      {selectedPlan && (
        <UsePlanModal
          isOpen={!!selectedPlan}
          onClose={() => setSelectedPlan(null)}
          plan={selectedPlan}
        />
      )}
    </div>
  );
}
