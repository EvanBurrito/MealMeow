'use client';

import { useState, useTransition } from 'react';
import { SharedMealPlanWithFoods, CatFood } from '@/types';
import { getKcalPerUnit } from '@/lib/nutrition';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';
import CatAvatar from './CatAvatar';

interface SharedPlanCardProps {
  plan: SharedMealPlanWithFoods;
  onUsePlan?: (plan: SharedMealPlanWithFoods) => void;
}

export default function SharedPlanCard({ plan, onUsePlan }: SharedPlanCardProps) {
  const [isLiked, setIsLiked] = useState(plan.isLiked ?? false);
  const [isSaved, setIsSaved] = useState(plan.isSaved ?? false);
  const [likesCount, setLikesCount] = useState(plan.likes_count);
  const [savesCount, setSavesCount] = useState(plan.saves_count);
  const [isPending, startTransition] = useTransition();
  const supabase = createClient();

  // Get food objects that match the selections
  const foodMap = new Map<string, CatFood>();
  plan.foods.forEach((food) => foodMap.set(food.id, food));

  // Get foods with their meal counts
  const selectedFoods = plan.food_selections
    .map((selection) => ({
      food: foodMap.get(selection.foodId),
      mealCount: selection.mealCount,
    }))
    .filter((item): item is { food: CatFood; mealCount: number } => !!item.food);

  const isCombo = selectedFoods.length > 1;

  // Calculate amount per meal for each food
  const foodsWithAmounts = selectedFoods.map(({ food, mealCount }) => {
    const { kcal, unit } = getKcalPerUnit(food);
    const totalMeals = plan.food_selections.reduce((sum, s) => sum + s.mealCount, 0);
    const calorieShare = (mealCount / totalMeals) * plan.target_der;
    const dailyAmount = kcal > 0 ? calorieShare / kcal : 0;
    const amountPerMeal = mealCount > 0 ? dailyAmount / mealCount : 0;

    return {
      food,
      mealCount,
      dailyAmount: Math.round(dailyAmount * 100) / 100,
      amountPerMeal: Math.round(amountPerMeal * 100) / 100,
      unit,
    };
  });

  const handleLike = async () => {
    const previousState = isLiked;
    const newState = !isLiked;

    // Optimistic update
    setIsLiked(newState);
    setLikesCount((prev) => (newState ? prev + 1 : prev - 1));

    startTransition(async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        if (newState) {
          const { error } = await supabase.from('plan_likes').insert({
            user_id: user.id,
            plan_id: plan.id,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('plan_likes')
            .delete()
            .eq('user_id', user.id)
            .eq('plan_id', plan.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Error toggling like:', err);
        setIsLiked(previousState);
        setLikesCount((prev) => (previousState ? prev : prev + 1));
      }
    });
  };

  const handleSave = async () => {
    const previousState = isSaved;
    const newState = !isSaved;

    // Optimistic update
    setIsSaved(newState);
    setSavesCount((prev) => (newState ? prev + 1 : prev - 1));

    startTransition(async () => {
      try {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Not logged in');

        if (newState) {
          const { error } = await supabase.from('plan_saves').insert({
            user_id: user.id,
            plan_id: plan.id,
          });
          if (error) throw error;
        } else {
          const { error } = await supabase
            .from('plan_saves')
            .delete()
            .eq('user_id', user.id)
            .eq('plan_id', plan.id);
          if (error) throw error;
        }
      } catch (err) {
        console.error('Error toggling save:', err);
        setIsSaved(previousState);
        setSavesCount((prev) => (previousState ? prev : prev + 1));
      }
    });
  };

  const getCategoryLabel = (category: string | null) => {
    const labels: Record<string, string> = {
      indoor: 'Indoor Cat',
      outdoor: 'Active/Outdoor',
      weight_loss: 'Weight Loss',
      weight_gain: 'Weight Gain',
      senior: 'Senior Cat',
      kitten: 'Kitten',
      health: 'Health Focus',
    };
    return category ? labels[category] || category : null;
  };

  return (
    <Card variant="elevated" className="overflow-hidden">
      {/* Header with cat info */}
      {plan.cat && (
        <div className="flex items-center gap-3 mb-4 pb-4 border-b border-gray-100">
          <CatAvatar
            catId={plan.cat.id}
            name={plan.cat.name}
            imageUrl={plan.cat.profile_image_url}
            size="md"
            showName
          />
          <div className="flex-1" />
          {plan.category && (
            <span className="px-2.5 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-medium">
              {getCategoryLabel(plan.category)}
            </span>
          )}
        </div>
      )}

      {/* Plan Name & Info */}
      <div className="flex items-start gap-3 mb-4">
        {/* Food Images */}
        <div className="flex -space-x-3 flex-shrink-0">
          {foodsWithAmounts.slice(0, 2).map((item, index) => (
            <div
              key={item.food.id}
              className={`relative w-12 h-12 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 ${
                index === 0 ? 'z-10' : ''
              }`}
            >
              <SafeImagePreview
                src={item.food.image_url || ''}
                alt={item.food.product_name}
                fill
                className="object-contain p-1"
              />
            </div>
          ))}
        </div>

        {/* Plan Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            {isCombo && (
              <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                Combo
              </span>
            )}
          </div>
          <h3
            className="font-semibold text-gray-900 leading-tight truncate"
            title={plan.plan_name}
          >
            {plan.plan_name}
          </h3>
          <p className="text-gray-600 text-sm">{plan.target_der} kcal target</p>
        </div>
      </div>

      {/* Food List - Compact */}
      <div className="space-y-1.5 mb-4">
        {foodsWithAmounts.map((item) => (
          <div
            key={item.food.id}
            className="flex items-center justify-between text-sm"
          >
            <span className="text-gray-700 truncate flex-1">
              {item.food.brand} {item.food.product_name}
            </span>
            <span className="text-gray-500 ml-2 flex-shrink-0">
              {item.amountPerMeal} {item.unit}(s)
            </span>
          </div>
        ))}
      </div>

      {/* Stats Row */}
      <div className="flex items-center justify-between py-3 border-t border-gray-100">
        <div className="flex items-center gap-4 text-sm text-gray-600">
          <span>{plan.meals_per_day}x daily</span>
          {plan.total_monthly_cost && (
            <span className="text-green-600 font-medium">
              ${plan.total_monthly_cost.toFixed(0)}/mo
            </span>
          )}
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <span>{plan.uses_count} uses</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
        <button
          onClick={handleLike}
          disabled={isPending}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isLiked
              ? 'bg-red-100 text-red-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>{isLiked ? '❤️' : '🤍'}</span>
          <span>{likesCount}</span>
        </button>

        <button
          onClick={handleSave}
          disabled={isPending}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
            isSaved
              ? 'bg-blue-100 text-blue-600'
              : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
          }`}
        >
          <span>{isSaved ? '🔖' : '📌'}</span>
          <span>{savesCount}</span>
        </button>

        <div className="flex-1" />

        <Button
          variant="primary"
          size="sm"
          onClick={() => onUsePlan?.(plan)}
        >
          Use This Plan
        </Button>
      </div>
    </Card>
  );
}
