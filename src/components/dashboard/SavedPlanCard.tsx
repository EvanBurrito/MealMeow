'use client';

import { useState } from 'react';
import Link from 'next/link';
import { SavedMealPlanWithFoods, CatFood } from '@/types';
import { getKcalPerUnit, getTotalKcalPerUnit, calculateCostPer100kcal } from '@/lib/nutrition';
import { createClient } from '@/lib/supabase/client';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import SafeImagePreview from '@/components/ui/SafeImagePreview';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface SavedPlanCardProps {
  plan: SavedMealPlanWithFoods;
  onDeleted?: () => void;
}

export default function SavedPlanCard({ plan, onDeleted }: SavedPlanCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const supabase = createClient();

  // Get food objects that match the selections
  const foodMap = new Map<string, CatFood>();
  plan.foods.forEach(food => foodMap.set(food.id, food));

  // Calculate displayed values
  const totalKcal = plan.total_kcal ?? 0;
  const dailyCost = plan.total_daily_cost ?? 0;
  const monthlyCost = plan.total_monthly_cost ?? 0;
  const mealsPerDay = plan.meals_per_day;

  // Get foods with their meal counts
  const selectedFoods = plan.food_selections
    .map(selection => ({
      food: foodMap.get(selection.foodId),
      mealCount: selection.mealCount,
    }))
    .filter((item): item is { food: CatFood; mealCount: number } => !!item.food);

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

  const isCombo = selectedFoods.length > 1;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      const { error } = await supabase
        .from('saved_meal_plans')
        .delete()
        .eq('id', plan.id);

      if (error) throw error;
      onDeleted?.();
    } catch (err) {
      console.error('Error deleting plan:', err);
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <>
      <Card variant="elevated" className="overflow-hidden">
        {/* Header */}
        <div className="flex items-start gap-3 mb-4">
          {/* Food Images */}
          <div className="flex -space-x-3 flex-shrink-0">
            {foodsWithAmounts.slice(0, 2).map((item, index) => (
              <div
                key={item.food.id}
                className={`relative w-14 h-14 rounded-xl overflow-hidden bg-gray-50 border border-gray-100 ${
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
              <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full text-xs font-medium">
                Saved Plan
              </span>
              {isCombo && (
                <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full text-xs font-medium">
                  Combo
                </span>
              )}
            </div>
            <h3 className="font-semibold text-gray-900 leading-tight truncate" title={plan.plan_name}>
              {plan.plan_name}
            </h3>
            <p className="text-gray-600 text-sm">
              {plan.target_der} kcal target
            </p>
          </div>
        </div>

        {/* Food Details */}
        {foodsWithAmounts.length > 0 ? (
          <div className="space-y-2 mb-4">
            {foodsWithAmounts.map((item, index) => (
              <div
                key={item.food.id}
                className={`flex items-center gap-3 rounded-xl p-3 ${
                  index === 0 ? 'bg-orange-50' : 'bg-blue-50'
                }`}
              >
                <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-white border border-gray-100 flex-shrink-0">
                  <SafeImagePreview
                    src={item.food.image_url || ''}
                    alt={item.food.product_name}
                    fill
                    className="object-contain p-0.5"
                  />
                </div>
                <div className="flex-1 min-w-0 overflow-hidden">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {item.food.product_name}
                  </p>
                  <p className="text-xs text-gray-500">{item.food.brand}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <div className={`text-lg font-bold ${index === 0 ? 'text-orange-600' : 'text-blue-600'}`}>
                    {item.amountPerMeal}
                  </div>
                  <div className="text-xs text-gray-500">{item.unit}(s)/meal</div>
                </div>
              </div>
            ))}
            <div className="text-center text-sm text-gray-500">
              {mealsPerDay}x daily
            </div>
          </div>
        ) : (
          <div className="text-center py-4 mb-4 bg-gray-50 rounded-xl">
            <p className="text-sm text-gray-500">No foods selected</p>
          </div>
        )}

        {/* Daily Summary */}
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-4 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-sm text-gray-600">Daily Total</div>
              <div className="text-lg font-bold text-gray-900">
                {totalKcal} kcal
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">Est. Cost</div>
              <div className="text-lg font-bold text-green-600">
                ${monthlyCost.toFixed(2)}/mo
              </div>
            </div>
          </div>
        </div>

        {/* Quick Info */}
        <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
          <span>Target: {plan.target_der} kcal/day</span>
          <span>${dailyCost.toFixed(2)}/day</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link
            href={`/saved-plans/${plan.id}/edit`}
            className="flex-1"
          >
            <Button variant="outline" size="sm" className="w-full">
              Edit Plan
            </Button>
          </Link>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowDeleteConfirm(true)}
            isLoading={isDeleting}
            className="text-red-600 hover:bg-red-50 hover:border-red-200"
          >
            Delete
          </Button>
        </div>
      </Card>

      <ConfirmDialog
        isOpen={showDeleteConfirm}
        title="Delete Saved Plan"
        message={`Are you sure you want to delete "${plan.plan_name}"? This action cannot be undone.`}
        confirmLabel="Delete"
        variant="danger"
        onConfirm={handleDelete}
        onClose={() => setShowDeleteConfirm(false)}
        isLoading={isDeleting}
      />
    </>
  );
}
